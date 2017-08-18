//@flow
import DynamoDBDao from "./DynamoDBDao"
import User from "../entity/User"

import uuid from 'uuid'
import IndexDefinition from "../IndexDefinition"
import Card from "../entity/Card"

export const USER_TABLE = "User"
export const CARD_TABLE = "Card"

export class DynamoDBDataService {

    dao: DynamoDBDao

    constructor(region: string, endpoint: string) {
        this.dao = new DynamoDBDao(region, endpoint)
    }

    init(): Promise<void> {
        // Note: DynamoDB secondary indexes don't guarantee uniqueness
        return this.dao.createTable('User', [new IndexDefinition("email", "string")])
            .then(() => this.dao.createTable('Card', []))
    }

    saveUser(user: User): Promise<User> {
        const id = uuid.v1()
        const fields = {"email": user.email}

        user.id = id

        return this.dao.insert(USER_TABLE, {"id": id}, fields).then(() => Promise.resolve(user))
    }

    saveCard(card: Card): Promise<Card> {
        const id = uuid.v1()
        const fields: Object = {"q": card.question, "a": card.answer}
        if (card.due) {
            fields.d = card.due
        }

        card.id = id

        return this.dao.insert(CARD_TABLE, {"id": id}, fields).then(() => Promise.resolve(card))
    }
}