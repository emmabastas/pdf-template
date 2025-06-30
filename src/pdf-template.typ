#let text(name: none, description: none, default: none) = {
    assert(name != none,
        message: "`name` keyword is required")
    assert(type(name) == str,
        message: "`name` keyword should be a string")
    assert(type(description) == str or description == none,
        message: "`name` should be a string or `none`")
    assert(type(default) == str or default == none,
        message: "`name` should be a string or `none`")

    let meta = metadata((
        type: "text",
        name: name,
        description: description,
        default: default,
    ))

    let value = dictionary(sys).at(name, default: default)
    if value == none {
        return [
            $#rect(stroke: 1pt)[name]$
            #meta <pdf-template-field>
        ]
    }
    assert(type(value) == str, message: "TODO message")
    return [
        #value
        #meta <pdf-template-field>
    ]
}
