#import "/pdf-template.typ"

#let world = pdf-template.text.with(
    name: "world",
    description: "Which world does this concearn?",
    default: "Earth"
)

Hello #world()!
