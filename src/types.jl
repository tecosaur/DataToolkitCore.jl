struct QualifiedType
    parentmodule::Symbol
    name::Symbol
end

struct Identifier
    layer::Union{AbstractString, Nothing}
    dataset::Union{AbstractString, UUID}
    type::Union{QualifiedType, Nothing}
    parameters::Dict{String, Any}
end

"""
The supertype for methods producing or consuming data.
```
                 ╭────loader─────╮
                 ╵               ▼
Storage ◀────▶ Data          Information
                 ▲               ╷
                 ╰────writer─────╯
```

There are three subtypes:
- `DataStorage`
- `DataLoader`
- `DataWrite`

Each subtype takes a `Symbol` type parameter designating
the driver which should be used to perform the data operation.
In addition, each subtype has the following fields:
- `dataset::DataSet`, the data set the method operates on
- `supports::Vector{QualifiedType}`, the Julia types the method supports
- `priority::Int`, the priority with which this method should be used,
  compared to alternatives. Lower values have higher priority.
- `arguments::Dict{String, Any}`, any arguments applied to the method.
"""
abstract type AbstractDataTransformer end

struct DataStorage{driver, T} <: AbstractDataTransformer
    dataset::T
    supports::Vector{QualifiedType}
    priority::Int
    arguments::Dict{String, Any}
end

struct DataLoader{driver} <: AbstractDataTransformer
    dataset
    supports::Vector{QualifiedType}
    priority::Int
    arguments::Dict{String, Any}
end

struct DataWriter{driver} <: AbstractDataTransformer
    dataset
    supports::Vector{QualifiedType}
    priority::Int
    arguments::Dict{String, Any}
end

# DataTransducer, DataAdvice, or something else?
"""
    DataTransducer{context<:AbstractDataTransformer} <: Function
DataTransducers allow for composible, highly flexible modifications of data.
They are inspired by elisp's advice system, namely the most versitile form —
`:around` advice, and Clojure's transducers.

A `DataTransducer` is esentially a function wrapper, with a `priority::Int`
attribute. The wrapped functions should be functions of the form:
```
(context::AbstractDataTransformer, transformfn::Function, (args...), (;kargs...)) ->
  (context::AbstractDataTransformer, transformfn::Function, (args...), (;kargs...))
```

To specify which transforms a DataTransducer should be applied to, ensure you
add the relevant type parameters to your transducing function. In cases where
the transducing function is not applicable, the DataTransducer will simply act
as the identity function.

After all applicable `DataTransducer`s have been applied, `transformfn(context,
args...; kargs...)` is called to produce the final result.

# Constructors

```
DataTransducer(priority::Int, f::Function)
DataTransducer(f::Function) # priority is set to 1
```

# Examples

Should you want to log every time a DataSet is loaded, one could
write the following DataTransducer:
```
loggingtransducer = DataTransducer(
    function(loader::DataLoader, loadfn, (datain, outtype), kwargs)
        @info "Loading \$(loader.data.name)"
        (loadfn, loader, (datain, outtype), kwargs)
    end)
```

Should you wish to automatically commit each write:
```
writecommittransducer = DataTransducer(
    function(writer::DataWriter{:filesystem}, writefn, (output, info)::Tuple{File, Any}, kwargs)
        writecommit(writer, output::File, info) =
          (writefn(writer, output, info); run(`git commit \$output`))
        (writer, writefn, (output, info), kwargs)
    end)
```
"""
mutable struct DataTransducer{context<:AbstractDataTransformer} <: Function
    priority::Int # Should this be an Int?
    f::Function
    function DataTransducer(priority::Int, f::Function)
        validmethods = methods(f, Tuple{AbstractDataTransformer, Function, Tuple, NamedTuple})
        if length(validmethods) === 0
            throw(ArgumentError("Transducing function $f had no valid methods."))
        end
        ctx = first(validmethods).sig.types[2]
        new{ctx}(priority, f)
    end
end

struct Plugin
    name::String
    transducers::Vector{DataTransducer}
    # TODO config read/write function(s)
    # probably by further generalising DataTransducer
end

struct DataStore
    name::AbstractString
    storage::DataStorage
end

struct DataSet
    collection
    name::String
    uuid::UUID
    store::String
    parameters::Dict{String, Any}
    storage::Vector{DataStorage}
    loaders::Vector{DataLoader}
    writers::Vector{DataWriter}
end

struct DataCollection
    version::Int
    name::Union{String, Nothing}
    uuid::UUID
    plugins::Vector{String}
    defaults::Dict{String, Any}
    stores::Vector{DataStore}
    datasets::Vector{DataSet}
    writer::Union{Function, Nothing}
end
