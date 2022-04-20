var documenterSearchIndex = {"docs":
[{"location":"advising/#Data-Advising","page":"Data Advice","title":"Data Advising","text":"","category":"section"},{"location":"advising/#Advice","page":"Data Advice","title":"Advice","text":"","category":"section"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"DataAdvice","category":"page"},{"location":"advising/#DataToolkitBase.DataAdvice","page":"Data Advice","title":"DataToolkitBase.DataAdvice","text":"DataAdvice{context, func} <: Function\n\nDataAdvices allow for composable, highly flexible modifications of data by encapsulating a function call. They are inspired by elisp's advice system, namely the most versitile form — :around advice, and Clojure's advisors.\n\nA DataAdvice is esentially a function wrapper, with a priority::Int attribute. The wrapped functions should be of the form:\n\n(post::Function, action::Function, args...; kargs...) ->\n  (post::Function, action::Function, args, kargs)\n\nA three-tuple result with kargs ommited is also accepted, in which case the an empty kargs value will be automatically substituted as the fourth value.\n\n    input=(action args kwargs)\n         ┃                 ┏╸post=identity\n       ╭─╂────advisor #1───╂─╮\n       ╰─╂─────────────────╂─╯\n       ╭─╂────advisor #2───╂─╮\n       ╰─╂─────────────────╂─╯\n       ╭─╂────advisor #3───╂─╮\n       ╰─╂─────────────────╂─╯\n         ┃                 ┃\n         ▼                 ▽\naction(args; kargs) ━━━━▶ post╺━━▶ result\n\nTo specify which transforms a DataAdvice should be applied to, ensure you add the relevant type parameters to your transducing function. In cases where the transducing function is not applicable, the DataAdvice will simply act as the identity function.\n\nAfter all applicable DataAdvices have been applied, action(args...; kargs...) |> post is called to produce the final result.\n\nBy modifying post via rightwards-composition (i.e. post -> post ∘ extra) the transdurers compose quite nicely.\n\n        ╭ advisor #1 ╌╌╌╌╌╌╌╌─╮\n        ┆ ╭ advisor #2 ╌╌╌╌╌╮ ┆\n        ┆ ┆                 ┆ ┆\ninput ━━┿━┿━━━▶ function ━━━┿━┿━━▶ result\n        ┆ ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ ┆\n        ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯\n\nWithout a very, very good reason all advisors should behave this way. Otherwise, when post is left-composed (i.e. post -> extra ∘ post), advisors compose like so:\n\n        ╭ advisor #1 ╌╌╌╌╌╌─╮\n        ┆ ╭ advisor #2 ╌╌╌╌╌┼╌╮\n        ┆ ┆                 ┆ ┆\ninput ━━┿━┿━━━▶ function ━━━┿━┿━━▶ result\n        ╰╌┼╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯ ┆\n          ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯\n\nConstructors\n\nDataAdvice(priority::Int, f::Function)\nDataAdvice(f::Function) # priority is set to 1\n\nExamples\n\nLogging every time a DataSet is loaded.\n\nloggingadvisor    = DataAdvice(\n    function(post::Function, f::typeof(load), loader::DataLoader, input, outtype)\n        @info \"Loading $(loader.data.name)\"\n        (post, f, (loader, input, outtype))\n    end)\n\nAutomatically committing each file written.\n\nwritecommitadvisor    = DataAdvice(\n    function(post::Function, f::typeof(write), writer::DataWriter{:filesystem}, output, info)\n        function writecommit(result)\n            run(`git add $output`)\n            run(`git commit -m \"update $output\"`)\n            result\n        end\n        (post ∘ writecommit, writefn, (output, info))\n    end)\n\n\n\n\n\n","category":"type"},{"location":"advising/#Advisement-points","page":"Data Advice","title":"Advisement points","text":"","category":"section"},{"location":"advising/#Construction-of-data-sets-and-collections","page":"Data Advice","title":"Construction of data sets and collections","text":"","category":"section"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"~DataCollection~​s, ~DataStore~​s, and ~AbstractDataTransformer~​s are advised at two stages during construction:","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"When calling fromspec on the Dict representation, at the start of","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"construction","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"At the end of construction, calling identity on the object","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"The signatures of the advised function calls are as follows:","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"fromspec(DataCollection, spec::Dict{String, Any}; path::Union{String, Nothing})\nidentity(DataCollection)","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"fromspec(DataSet, collection::DataCollection, name::String, spec::Dict{String, Any})\nidentity(DataSet)","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"fromspec(ADT::Type{<:AbstractDataTransformer}, dataset::DataSet, spec::Dict{String, Any})\nidentity(ADT::AbstractDataTransformer)","category":"page"},{"location":"advising/#Processing-identifiers","page":"Data Advice","title":"Processing identifiers","text":"","category":"section"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"Both the parsing of an Identifier from a string, and the serialisation of an Identifier to a string are advised. Specifically, the following function calls:","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"parse(Identifier, spec::AbstractString, advised=true)\nstring(ident::Identifier)","category":"page"},{"location":"advising/#The-data-flow-arrows","page":"Data Advice","title":"The data flow arrows","text":"","category":"section"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"The reading, writing, and storage of data may all be advised. Specifically, the following function calls:","category":"page"},{"location":"advising/","page":"Data Advice","title":"Data Advice","text":"load(loader::DataLoader, datahandle, as::Type)\nstorage(provider::DataStorage, as::Type; write::Bool)\nwriteinfo(writer::DataWriter, datahandle, info)","category":"page"},{"location":"libpublic/#Public-API","page":"Public","title":"Public API","text":"","category":"section"},{"location":"libpublic/#Read/Write-Information","page":"Public","title":"Read/Write Information","text":"","category":"section"},{"location":"libpublic/","page":"Public","title":"Public","text":"read","category":"page"},{"location":"libpublic/#Base.read","page":"Public","title":"Base.read","text":"read(filename::AbstractString, DataCollection; writer::Union{Function, Nothing})\n\nRead the entire contents of a file as a DataCollection.\n\nThe default value of writer is self -> write(filename, self).\n\n\n\n\n\nread(io::IO, DataCollection; writer::Union{Function, Nothing}=nothing)\n\nRead the entirity of io, as a DataCollection.\n\n\n\n\n\nread(dataset::DataSet, as::Type)\n\nObtain information from dataset in the form of as, with the appropriate loader and storage provider automatically determined.\n\nThis executes this component of the overall data flow:\n\n                 ╭────loader─────╮\n                 ╵               ▼\nStorage ◀────▶ Data          Information\n\nThe loader and storage provider are selected by identifying the highest priority loader that can be saisfied by a storage provider. What this looks like in practice is illustrated in the diagram below.\n\n      read(dataset, Matrix) ⟶ ::Matrix ◀╮\n         ╭───╯        ╰────────────▷┬───╯\n╔═════╸dataset╺══════════════════╗  │\n║ STORAGE      LOADERS           ║  │\n║ (⟶ File)─┬─╮ (File ⟶ String)   ║  │\n║ (⟶ IO)   ┊ ╰─(File ⟶ Matrix)─┬─╫──╯\n║ (⟶ File)┄╯   (IO ⟶ String)   ┊ ║\n║              (IO ⟶ Matrix)╌╌╌╯ ║\n╚════════════════════════════════╝\n\n  ─ the load path used\n  ┄ an option not taken\n\nTODO explain further\n\n\n\n\n\n","category":"function"},{"location":"libpublic/","page":"Public","title":"Public","text":"write","category":"page"},{"location":"libpublic/#Base.write","page":"Public","title":"Base.write","text":"write(dataset::DataSet, info::Any)\n\nTODO write docstring\n\n\n\n\n\n","category":"function"},{"location":"libpublic/#Open-storage-handle","page":"Public","title":"Open storage handle","text":"","category":"section"},{"location":"libpublic/","page":"Public","title":"Public","text":"open","category":"page"},{"location":"libpublic/#Base.open","page":"Public","title":"Base.open","text":"open(dataset::DataSet, as::Type)\n\nObtain the data of dataset in the form of as, with the appropriate storage provider automatically selected.\n\nThis executes this component of the overall data flow:\n\n                 ╭────loader─────╮\n                 ╵               ▼\nStorage ◀────▶ Data          Information\n\n\n\n\n\n","category":"function"},{"location":"libinternal/#Private-API","page":"Internals","title":"Private API","text":"","category":"section"},{"location":"libinternal/#Read/Write-Information","page":"Internals","title":"Read/Write Information","text":"","category":"section"},{"location":"libinternal/","page":"Internals","title":"Internals","text":"load","category":"page"},{"location":"libinternal/#DataToolkitBase.load","page":"Internals","title":"DataToolkitBase.load","text":"load(loader::DataLoader{driver}, source::Any, as::Type)\n\nUsing a certain loader, obtain information in the form of as from the data given by source.\n\nThis fufills this component of the overall data flow:\n\n  ╭────loader─────╮\n  ╵               ▼\nData          Information\n\n\n\n\n\n","category":"function"},{"location":"libinternal/","page":"Internals","title":"Internals","text":"writeinfo","category":"page"},{"location":"libinternal/#Open-storage-handle","page":"Internals","title":"Open storage handle","text":"","category":"section"},{"location":"libinternal/","page":"Internals","title":"Internals","text":"storage","category":"page"},{"location":"libinternal/","page":"Internals","title":"Internals","text":"getstorage","category":"page"},{"location":"libinternal/","page":"Internals","title":"Internals","text":"putstorage","category":"page"},{"location":"repl/#The-Data-REPL","page":"REPL","title":"The Data REPL","text":"","category":"section"},{"location":"repl/#Getting-help","page":"REPL","title":"Getting help","text":"","category":"section"},{"location":"repl/","page":"REPL","title":"REPL","text":"The help command will give an overview of the data commands available, and one may call help CMD for an description of a particular data command.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> help\ndata> help stack","category":"page"},{"location":"repl/#Acting-on-the-data-collection-stack","page":"REPL","title":"Acting on the data collection stack","text":"","category":"section"},{"location":"repl/","page":"REPL","title":"REPL","text":"To list the current data collections on the stack, simply call the stack command with no arguments.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> stack","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"The stack command also allows you to operate on the data collection stack. The load subcommand adds new layer from a data collection specification file, one may run:","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> stack load path/to/Data.toml","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"The freshly loaded data collection will be placed at the top of the stack. Reloading a collection thus moves it to the top of the stack. However, dedicated subcommands exist for moving layers of the data stack. To move a collection to the top of the stack, one may use the promote subcommand.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> stack promote NAME OR UUID","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"Similarly, to move a collection down the stack, one may use the demote subcommand.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> stack demote NAME OR UUID","category":"page"},{"location":"repl/#Looking-at-data-sets-in-a-collection","page":"REPL","title":"Looking at data sets in a collection","text":"","category":"section"},{"location":"repl/","page":"REPL","title":"REPL","text":"The available data sets within a collection can be viewed with the list command","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> list","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"This lists the data sets present in the collection at the top of the stack. To view the data sets of another collection, provide its name to the list command.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> list OTHER DATA COLLECTION","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"One may also view a particular data set in more detail using the show command. Simply give a data Identifier and it will resolve it &mdash; much like the dataset function, but without requiring you to leave the Data REPL.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"show IDENTIFIER","category":"page"},{"location":"repl/#Creating-a-new-data-set","page":"REPL","title":"Creating a new data set","text":"","category":"section"},{"location":"repl/#From-scratch","page":"REPL","title":"From scratch","text":"","category":"section"},{"location":"repl/#From-a-storage-location","page":"REPL","title":"From a storage location","text":"","category":"section"},{"location":"repl/#Removing-a-data-set","page":"REPL","title":"Removing a data set","text":"","category":"section"},{"location":"repl/#Creating-new-REPL-commands","page":"REPL","title":"Creating new REPL commands","text":"","category":"section"},{"location":"repl/","page":"REPL","title":"REPL","text":"The Data REPL can be easily extended in just a few steps.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"First, one must create a ReplCmd object, like so:","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"ReplCmd{:demo}(\"A demo command\", _ -> \"Hello\")","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"ReplCmd","category":"page"},{"location":"repl/#DataToolkitBase.ReplCmd","page":"REPL","title":"DataToolkitBase.ReplCmd","text":"A command that can be used in the data> REPL (accessible through '}').\n\nA ReplCmd must have a:\n\nname, a symbol designating the command keyword.\ndescription, a string giving a short overview of the functionality.\nexecute, a function which will perform the command's action. The function must take a single argument, the rest of the command as an AbstractString (for example, 'cmd arg1 arg2' will call the execute function with \"arg1 arg2\").\n\nA ReplCmd may also (optionally) have a shorthand which triggers the command.\n\nConstructors\n\nReplCmd{name::Symbol}(shorthand::Union{String, Nothing}, description::String, execute::Function)\nReplCmd{name::Symbol}(description::String, execute::Function)\nReplCmd(name::Union{Symbol, String}, shorthand::Union{String, Nothing}, description::String, execute::Function)\nReplCmd(name::Union{Symbol, String}, description::String, execute::Function)\n\nMethods\n\nhelp(::ReplCmd) # -> print detailed help\nallcompletions(::ReplCmd, sofar::AbstractString) # -> list all candidates\ncompletions(::ReplCmd, sofar::AbstractString) # -> list relevant candidates\n\n\n\n\n\n","category":"type"},{"location":"repl/","page":"REPL","title":"REPL","text":"Then, simply push this to the global vector REPL_CMDS. You can now call the demo command in the Data REPL.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> demo\n\"hello\"","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"An expanded help message can be provided by adding a method to the help function as follows:","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"function help(::ReplCmd{:demo})\n    println(stderr, \"This is a demo command created for the Data REPL documentation.\")\nend","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"This will be shown when calling the help command on demo. By default, the short description given when creating ReplCmd{:demo} is used. The short description is always used in the help table.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"data> help\n Command  Shorthand  Action                                                  \n ──────────────────────────────────\n demo                A demo command\n ...                 ...\n \ndata> help demo\nThis is a demo command created for the Data REPL","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"Completions can also be provided by adding a method to the completion function.","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"function completions(::ReplCmd{:demo}, input::AbstractString)\n    filter(s -> startswith(s, \"input\"), [\"hi\", \"hello\", \"howdy\"])\nend","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"For reference, the default implementations of help and completions are as follows:","category":"page"},{"location":"repl/","page":"REPL","title":"REPL","text":"help(r::ReplCmd) = println(stderr, r.description)\ncompletions(::ReplCmd, ::AbstractString) = String[]","category":"page"},{"location":"packages/#Using-Packages","page":"Packages","title":"Using Packages","text":"","category":"section"},{"location":"packages/","page":"Packages","title":"Packages","text":"It is entirely likely that in the course of writing a package providing a custom data transformer, one would come across packages that may be needed.","category":"page"},{"location":"packages/","page":"Packages","title":"Packages","text":"Every possibly desired package could be shoved into the list of dependences, but this is a somewhat crude approach. A more granular approach is enabled with two macros, @addpkg and @use.","category":"page"},{"location":"packages/#Letting-DataToolkitBase-know-about-extra-packages","page":"Packages","title":"Letting DataToolkitBase know about extra packages","text":"","category":"section"},{"location":"packages/","page":"Packages","title":"Packages","text":"@addpkg","category":"page"},{"location":"packages/#DataToolkitBase.@addpkg","page":"Packages","title":"DataToolkitBase.@addpkg","text":"@addpkg name::Symbol uuid::String\n\nRegister the package identifed by name with UUID uuid. This package may now be used with @use $name.\n\nAll @addpkg statements should lie within a module's __init__ function.\n\nExample\n\n@addpkg CSV \"336ed68f-0bac-5ca0-87d4-7b16caf5d00b\"\n\n\n\n\n\n","category":"macro"},{"location":"packages/#Using-extra-packages","page":"Packages","title":"Using extra packages","text":"","category":"section"},{"location":"packages/","page":"Packages","title":"Packages","text":"@use","category":"page"},{"location":"packages/#DataToolkitBase.@use","page":"Packages","title":"DataToolkitBase.@use","text":"@use pkg1 pkg2...\n\nFetch previously registered modules.\n\n@use pkg1 loads the module pkg1 into the current scope as pkg1. Multiple packages may be loaded all at once by seperating each package name with a space.\n\n\n\n\n\n","category":"macro"},{"location":"packages/#Example","page":"Packages","title":"Example","text":"","category":"section"},{"location":"packages/","page":"Packages","title":"Packages","text":"module DataToolkitExample\n\nusing DataToolkitBase\nusing DataFrame\n\nfunction __init__()\n    @addpkg CSV \"336ed68f-0bac-5ca0-87d4-7b16caf5d00b\"\n    @addpkg DelimitedFiles \"8bb1440f-4735-579b-a4ab-409b98df4dab\"\nend\n\nfunction load(::DataLoader{:csv}, from::IOStream, ::Type{DataFrame})\n    @use CSV\n    result = CSV.read(from, DataFrame)\n    close(from)\n    result\nend\n\nfunction load(::DataLoader{:delimcsv}, from::IOStream, ::Type{DataFrame})\n    @use DelimitedFiles\n    result = DelimitedFiles.readdlm(from, ',', DataFrame)\n    close(from)\n    result\nend\n\nend","category":"page"},{"location":"#Introduction","page":"Introduction","title":"Introduction","text":"","category":"section"},{"location":"#The-problem-with-the-current-state-of-affairs","page":"Introduction","title":"The problem with the current state of affairs","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Data is beguiling. It can initially seem simple to deal with: \"here I have a file, and that's it\". However as soon as you do things with the data you're prone to be asked tricky questions like:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"where's the data?\nhow did you process that data?\nhow can I be sure I'm looking at the same data as you?","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"This is no small part of the replication crisis.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"(Image: image)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Further concerns arise as soon as you start dealing with large quantities of data, or computationally expensive derived data sets. For example:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Have I already computed this data set somewhere else?\nIs my generated data up to date with its sources/dependencies?","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Generic tools exist for many parts of this problem, but there are some benefits that can be realised by creating a Julia-specific system, namely:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Having all pertinent environmental information in the data processing contained in a single Project.toml\nImproved convenience in data loading and management, compared to a generic solution\nAllowing datasets to be easily shared with a Julia package","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"In addition, the Julia community seems to have a strong tendency to NIH[NIH] tools, so we may as well get ahead of this and try to make something good 😛.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"[NIH]: Not Invented Here, a tendency to \"reinvent the wheel\" to avoid using tools from external origins &mdash; it would of course be better if you (re)made it.","category":"page"},{"location":"#Pre-existing-solutions","page":"Introduction","title":"Pre-existing solutions","text":"","category":"section"},{"location":"#DataLad","page":"Introduction","title":"DataLad","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Does a lot of things well\nPuts information on how to create data in git commit messages (bad)\nNo data file specification","category":"page"},{"location":"#Kedro-data-catalog","page":"Introduction","title":"Kedro data catalog","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Has a file defining all the data (good)\nHas poor versioning\nhttps://kedro.readthedocs.io/en/stable/data/data_catalog.html\nData Catalog CLI","category":"page"},{"location":"#Snakemake","page":"Introduction","title":"Snakemake","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Workflow manager, with remote file support\nSnakemake Remote Files\nGood list of possible file locations to handle\nDrawback is that you have to specify the location you expect(S3, http, FTP, etc.)\nNo data file specification","category":"page"},{"location":"#Nextflow","page":"Introduction","title":"Nextflow","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Workflow manager, with remote file support\nDocs on files and IO\nDocs on S3\nYou just call file() and nextflow figures out under the hood the protocol whether it should pull it from S3, http, FTP, or a local file.\nNo data file specification","category":"page"}]
}
