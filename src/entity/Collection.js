//@flow
export default class Collection {
    id: string
    decks: Array<string>

    constructor(id: string, decks: Array<string>) {
        this.id = id
        this.decks = decks
    }
}