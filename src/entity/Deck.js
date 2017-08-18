//@flow
export default class Deck {
    id: ?string
    name: string
    cards: Array<string>

    constructor(id: ?string, name: string, cards: Array<string>) {
        this.id = id
        this.name = name
        this.cards = cards
    }
}