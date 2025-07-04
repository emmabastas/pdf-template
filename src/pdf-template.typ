#let fieldInputs = json("/pdf-template-field-inputs.json")

#let shortText(name: none, description: none, default: none) = {
    assert(name != none,
        message: "`name` keyword is required")
    assert(type(name) == str,
        message: "`name` keyword should be a string")
    assert(type(description) == str or description == none,
        message: "`description` should be a string or `none`")
    assert(type(default) == str or default == none,
        message: "`default` should be a string or `none`")

    let meta = metadata((
        type: "shortText",
        name: name,
        description: description,
        default: default,
    ))

    let value = fieldInputs.at(name, default: none)
    if value == none or value == "" {
        return [
            $#rect(stroke: 1pt)[#name]$
            #meta <pdf-template-field>
        ]
    }

    assert(type(value) == str, message: "`value` should be a string")
    return [
        #value
        #meta <pdf-template-field>
    ]
}

#let longText(name: none, description: none, default: none) = {
    assert(name != none,
        message: "`name` keyword is required")
    assert(type(name) == str,
        message: "`name` keyword should be a string")
    assert(type(description) == str or description == none,
        message: "`description` should be a string or `none`")
    assert(type(default) == str or default == none,
        message: "`default` should be a string or `none`")

    let meta = metadata((
        type: "longText",
        name: name,
        description: description,
        default: default,
    ))

    let value = fieldInputs.at(name, default: none)
    if value == none or value == "" {
        return [
            $#rect(stroke: 1pt)[#name]$
            #meta <pdf-template-field>
        ]
    }

    assert(type(value) == str, message: "`value` should be a string")
    return [
        #value
        #meta <pdf-template-field>
    ]
}

#let number(name: none, description: none, default: none) = {
    assert(name != none,
        message: "`name` keyword is required")
    assert(type(name) == str,
        message: "`name` keyword should be a string")
    assert(type(description) == str or description == none,
        message: "`description` should be a string or `none`")
    assert(type(default) == int or default == none,
        message: "`default` should be an int or `none`")

    let meta = metadata((
        type: "number",
        name: name,
        description: description,
        default: default,
    ))

    let value = fieldInputs.at(name, default: none)
    if value == none {
        return [
            $#rect(stroke: 1pt)[#name]$
            #meta <pdf-template-field>
        ]
    }

    assert(type(value) == int, message: "`value` should be an int")
    return [
        #value
        #meta <pdf-template-field>
    ]
}
