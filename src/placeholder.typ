#import "/pdf-template.typ"

#set page("a4")

#let kundnamn = pdf-template.shortText.with(
    name: "Kunds namn",
)

#let kundadress = pdf-template.longText.with(
    name: "Kunds adress",
)

#let kundorgnr = pdf-template.shortText.with(
    name: "Kunds org. nr.",
)

#let kundmomsreg = pdf-template.shortText.with(
    name: "Kunds momsreg. nr.",
)

#let fakturadatum = pdf-template.shortText.with(
    name: "Fakturadatum",
    default: datetime.today().display(),
)

#let betalningsvillkor = pdf-template.number.with(
    name: "Betalningsvillkor",
)

#let förfallodatum
#if (type(betalningsvillkor()) == int) {
    förfallodatum = "TODO"
} else {
    förfallodatum = "TODO"
}

#let dittföretagsnamn = pdf-template.shortText.with(
    name: "Ditt företagsnamn",
)

#let dittorgnr = pdf-template.shortText.with(
    name: "Ditt org. nr.",
)

#let dittmomsregnr = pdf-template.shortText.with(
    name: "Ditt momsreg. rn.",
)

#let dinadress = pdf-template.longText.with(
    name: "Din adress",
)

#let dintelefon = pdf-template.shortText.with(
    name: "Din telefon",
)

#line(length: 100%, stroke: gray)

#grid(
    columns: (1fr, 1fr),
    gutter: 12pt,
    [
        Faktura till: \
        *#kundnamn()* \
        #kundadress() \
        Org. nr.: #kundorgnr() \
        Momsreg. nr.: #kundmomsreg()
    ],
    [
        #set align(right)
        Fakturadtaum: #fakturadatum() \
        Förfallodatum: #förfallodatum \
        Betalningsvillkor: #betalningsvillkor() dagar
    ],
)

#line(length: 100%, stroke: gray)

#table(
    columns: (1fr, auto, auto, auto, auto),
    inset: 10pt,
    align: horizon,
    table.header(
        [*Benämning*], [*Antal*], [*À-pris*], [*Belopp*], [*Moms*],
    ),
    [grej 1], [1], [1400], [(beräknat)], [(beräknat) (15%)]
)

#grid(
    columns: (1fr, 1fr),
    gutter: 12pt,
    [
        Belopp: [beräknat] \
        Moms: [beräknat] \
        *Total: [beräknat]*

    ],
    [
        #set align(right)
        #block[
        #set align(left)
        [kontotyp]: [beräknat] \
        Ange ocr: [ocr]
        ]
    ]
)


#line(length: 100%, stroke: gray)

*#dittföretagsnamn()* \
Org. nr.: #dittorgnr() \
Momsreg. nr.: #dittmomsregnr() \
#dinadress() \
Telefon: #dintelefon()
