//@flow
export default class Card {
    id: ?string
    question: string
    answer: string
    due: ?number

    constructor(id: ?string, question: string, answer: string, due: ?number) {
        this.id = id
        this.question = question
        this.answer = answer
        this.due = due
    }
}