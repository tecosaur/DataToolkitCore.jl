using REPL, REPL.LineEdit

const REPL_KEY = '}'
const REPL_NAME = :DataRepl
const REPL_PROMPTSTYLE = Base.text_colors[:magenta]

"""
A command that can be used in the `data>` REPL (accessible through '$REPL_KEY').

A `ReplCmd` must have a:
- `name`, a symbol designating the command keyword.
- `trigger`, a string used as the command trigger (defaults to `String(name)`).
- `description`, a string giving a short overview of the functionality.
- `execute`, a function which will perform the command's action. The function
  must take a single argument, the rest of the command as an `AbstractString`
  (for example, 'cmd arg1 arg2' will call the execute function with "arg1 arg2").

# Constructors

```julia
ReplCmd{name::Symbol}(trigger::String, description::String, execute::Function)
ReplCmd{name::Symbol}(description::String, execute::Function)
ReplCmd(name::Union{Symbol, String}, trigger::String, description::String, execute::Function)
ReplCmd(name::Union{Symbol, String}, description::String, execute::Function)
```

# Methods

```julia
help(::ReplCmd) # -> print detailed help
allcompletions(::ReplCmd, sofar::AbstractString) # -> list all candidates
completions(::ReplCmd, sofar::AbstractString) # -> list relevant candidates
```
"""
struct ReplCmd{name}
    trigger::String
    description::String
    execute::Function
end

ReplCmd{name}(description::String, execute::Function) where {name} =
    ReplCmd{name}(String(name), description, execute)

ReplCmd(name::Union{Symbol, String}, args...) =
    ReplCmd{Symbol(name)}(args...)

help(r::ReplCmd) = println(stderr, r.description)
completions(r::ReplCmd, sofar::AbstractString) =
    sort(filter(s -> startswith(s, sofar), allcompletions(r, sofar)))
allcompletions(::ReplCmd, ::AbstractString) = String[]

const REPL_CMDS = ReplCmd[]

function find_repl_cmd(cmd::AbstractString; warn::Bool=false)
    replcmds = filter(c -> startswith(c.trigger, cmd), REPL_CMDS)
    if length(replcmds) == 1
        first(replcmds)
    elseif warn && length(replcmds) > 1
        @error string("Multiple matching REPL commands: ",
                      join(getproperty.(replcmds, :trigger), ", "))
    elseif warn # no matching commands
        @error "The Data REPL command '$cmd' is not defined."
    end
end

function execute_repl_cmd(line::AbstractString)
    cmd_parts = split(line, limit = 2)
    cmd, rest = if length(cmd_parts) == 1
        cmd_parts[1], ""
    else
        cmd_parts
    end
    if startswith(cmd, "?") # help is special
        rest = cmd[2:end] * rest
        cmd = "help"
    end
    repl_cmd = find_repl_cmd(cmd, warn=true)
    if isnothing(repl_cmd)
        Expr(:block, :nothing)
    else
        repl_cmd.execute(rest)
    end
end

function complete_repl_cmd(line::AbstractString)
    if isempty(line)
        (sort(Vector{String}(
            map(c -> String(first(typeof(c).parameters)), REPL_CMDS))),
         "",
         true)
    else
        cmd_parts = split(line, limit = 2)
        cmd_name, rest = if length(cmd_parts) == 1
            cmd_parts[1], ""
        else
            cmd_parts
        end
        repl_cmd = find_repl_cmd(cmd_name)
        complete = if !isnothing(repl_cmd)
            completions(repl_cmd, rest)
        else
            Vector{String}(
                filter(ns -> startswith(ns, cmd_name),
                       sort(getproperty(REPL_CMDS, :trigger))))
        end
        if complete isa Tuple{Vector{String}, String, Bool}
            complete
        elseif complete isa Vector{String}
            (sort(complete),
                String(rest),
                !isempty(complete))
        else
            throw(error("REPL completions for $cmd_name returned strange result, $(typeof(complete))"))
        end
    end
end

struct DataCompletionProvider <: REPL.LineEdit.CompletionProvider end

function REPL.complete_line(::DataCompletionProvider,
                            state::REPL.LineEdit.PromptState)
    # See REPL.jl complete_line(c::REPLCompletionProvider, s::PromptState)
    partial = REPL.beforecursor(state.input_buffer)
    full = REPL.LineEdit.input_string(state)
    if partial != full
        # For now, only complete at end of line
        return ([], "", false)
    end
    complete_repl_cmd(full)
end

function init_repl()
    # With *heavy* inspiration taken from https://github.com/MasonProtter/ReplMaker.jl
    repl = Base.active_repl
    if !isdefined(repl, :interface)
        repl.interface = repl.setup_interface(repl)
    end
    julia_mode = repl.interface.modes[1]
    prompt_prefix, prompt_suffix = if repl.hascolor
        REPL_PROMPTSTYLE, "\e[m"
    else
        "", ""
    end

    data_mode = LineEdit.Prompt(
        "data> ";
        prompt_prefix,
        prompt_suffix,
        keymap_dict = LineEdit.default_keymap_dict,
        on_enter = LineEdit.default_enter_cb,
        complete = DataCompletionProvider(),
        sticky = true)
    data_mode.on_done = REPL.respond(execute_repl_cmd, repl, data_mode)

    push!(repl.interface.modes, data_mode)

    history_provider = julia_mode.hist
    history_provider.mode_mapping[REPL_NAME] = data_mode
    data_mode.hist = history_provider

    _, search_keymap = LineEdit.setup_search_keymap(history_provider)
    _, prefix_keymap = LineEdit.setup_prefix_keymap(history_provider, data_mode)
    julia_keymap = REPL.mode_keymap(julia_mode)

    data_mode.keymap_dict = LineEdit.keymap(Dict{Any, Any}[
        search_keymap,
        julia_keymap,
        prefix_keymap,
        LineEdit.history_keymap,
        LineEdit.default_keymap,
        LineEdit.escape_defaults
    ])

    key_alt_action =
        something(deepcopy(get(julia_mode.keymap_dict, REPL_KEY, nothing)),
                  (state, args...) -> LineEdit.edit_insert(state, REPL_KEY))
    function key_action(state, args...)
                if isempty(state) || position(LineEdit.buffer(state)) == 0
            function transition_action()
                LineEdit.state(state, data_mode).input_buffer =
                    copy(LineEdit.buffer(state))
            end
            LineEdit.transition(transition_action, state, data_mode)
        else
            key_alt_action(state, args...)
        end
    end

    data_keymap = Dict{Any, Any}(REPL_KEY => key_action)
    julia_mode.keymap_dict =
        LineEdit.keymap_merge(julia_mode.keymap_dict, data_keymap)

    data_mode
end

# ------------------
# REPL Commands
# ------------------

# help

function help_cmd_table(; maxwidth::Int=displaysize(stdout)[2])
    help_headings = ["Command", "Action"]
    help_lines = map(REPL_CMDS) do replcmd
        [String(first(typeof(replcmd).parameters)),
         replcmd.description]
    end
    map(displaytable(help_headings, help_lines; maxwidth)) do row
        print(stderr, ' ', row, '\n')
    end
end

function help_show(cmd::AbstractString)
    if isempty(cmd)
        help_cmd_table()
    else
        repl_cmd = DataToolkitBase.find_repl_cmd(cmd)
        if !isnothing(repl_cmd)
            help(repl_cmd)
        else
            printstyled(stderr, "ERROR: ", bold=true, color=:red)
            println(stderr, "Data command $cmd is not defined")
        end
    end
    Expr(:block, :nothing)
end

push!(REPL_CMDS,
      ReplCmd(:help,
              "Display help information on the availible data commands.",
              help_show))

allcompletions(::ReplCmd{:help}, rest::AbstractString) =
    map(c -> String(first(typeof(c).parameters)), REPL_CMDS)

# list

function list_datasets(collection_str::AbstractString; maxwidth::Int=displaysize(stdout)[2])
    if isempty(STACK)
        println(stderr, "The data collection stack is empty.")
    else
        collection = if isempty(collection_str)
            getlayer(nothing)
        else
            getlayer(collection_str)
        end
        table_rows = displaytable(
            ["Dataset", "Description"],
            map(sort(collection.datasets, by = d -> d.name)) do dataset
                [dataset.name,
                 first(split(get(dataset, "description", " "),
                             '\n', keepempty=false))]
            end; maxwidth)
        for row in table_rows
            print(stderr, ' ', row, '\n')
        end
    end
end

push!(REPL_CMDS,
      ReplCmd(:list,
              "List the datasets in a certain collection.",
              list_datasets))

allcompletions(::ReplCmd{:list}, rest::AbstractString) =
    filter(cn -> !isnothing(cn), map(c -> c.name, STACK))

help(r::ReplCmd{:list}) = println(stderr,
    r.description, "\n",
    "By default, the datasets of the active collection are shown."
)

# stack

function stack_table(::String; maxwidth::Int=displaysize(stdout)[2])
    table_rows = displaytable(
        ["#", "Name", "Datasets", "Plugins"],
        map(enumerate(STACK)) do (i, collection)
            [string(i), something(collection.name, ""),
            length(collection.datasets), join(collection.plugins, ", ")]
        end; maxwidth)
    for row in table_rows
        print(stderr, ' ', row, '\n')
    end
end

push!(REPL_CMDS,
      ReplCmd(:stack,
              "List the data collections in the stack.",
              stack_table))

# show

push!(REPL_CMDS,
    ReplCmd(:show,
        "List the dataset refered to by an identifier.",
        ident -> if isempty(ident)
            println("Provide a dataset to be shown.")
        else
            ds = resolve(parse(Identifier, ident))
            display(ds)
            if ds isa DataSet
                print("  UUID:    ")
                printstyled(ds.uuid, '\n', color=:light_magenta)
                if !isnothing(get(ds, "description"))
                    indented_desclines =
                        join(split(strip(get(ds, "description")),
                                   '\n'), "\n   ")
                    println("\n  “\e[3m", indented_desclines, "\e[m”")
                end
            end
            nothing
        end))

function allcompletions(::ReplCmd{:show}, sofar::AbstractString)
    try # In case `resolve` or `getlayer` fail.
        if !isnothing(match(r"^.+::", sofar))
                identifier = Identifier(first(split(sofar, "::")))
                types = map(l -> l.type, resolve(identifier).loaders) |>
                    Iterators.flatten .|> string |> unique
                string.(string(identifier), "::", types)
        elseif !isnothing(match(r"^[^:]+:", sofar))
            layer, _ = split(sofar, ':', limit=2)
            string.(layer, ':',
                    getproperty.(getlayer(layer).datasets, :name) |> unique)
        else
            vcat(getproperty.(STACK, :name) .* ':',
                getproperty.(getlayer(nothing).datasets, :name) |> unique)
        end
    catch _
        String[]
    end
end
