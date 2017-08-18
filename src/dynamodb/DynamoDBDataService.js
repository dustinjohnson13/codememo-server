//@flow
import DynamoDBDao from "./DynamoDBDao"
import User from "../entity/User"

import uuid from 'uuid'
import IndexDefinition from "../IndexDefinition"
import Card from "../entity/Card"
import Deck from "../entity/Deck"
import Collection from "../entity/Collection"

export const USER_TABLE = "User"
export const CARD_TABLE = "Card"
export const DECK_TABLE = "Deck"
export const COLLECTION_TABLE = "Collection"

export class DynamoDBDataService {

    dao: DynamoDBDao

    constructor(region: string, endpoint: string) {
        this.dao = new DynamoDBDao(region, endpoint)
    }

    init(): Promise<void> {
        // Note: DynamoDB secondary indexes don't guarantee uniqueness
        return this.dao.createTable(USER_TABLE, [new IndexDefinition("email", "string")])
            .then(() => this.dao.createTable(CARD_TABLE, []))
            .then(() => this.dao.createTable(DECK_TABLE, []))
            .then(() => this.dao.createTable(COLLECTION_TABLE, []))
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

    saveDeck(deck: Deck): Promise<Deck> {
        const id = uuid.v1()
        const fields: Object = {"n": deck.name, "c": deck.cards}

        deck.id = id

        return this.dao.insert(DECK_TABLE, {"id": id}, fields).then(() => Promise.resolve(deck))
    }

    saveCollection(collection: Collection): Promise<Collection> {
        const fields: Object = {"d": collection.decks}

        if (!collection.id) {
            throw new Error("Collections must have the user id specified as the id.")
        }

        return this.dao.insert(COLLECTION_TABLE, {"id": collection.id}, fields).then(() => Promise.resolve(collection))
    }

    deleteUser(id: string): Promise<string> {
        return this.dao.delete(USER_TABLE, {"id": id}).then(() => Promise.resolve(id))
    }

    deleteCard(id: string): Promise<string> {
        return this.dao.delete(CARD_TABLE, {"id": id}).then(() => Promise.resolve(id))
    }

    deleteDeck(id: string): Promise<string> {
        return this.dao.delete(DECK_TABLE, {"id": id}).then(() => Promise.resolve(id))
    }

    deleteCollection(id: string): Promise<string> {
        return this.dao.delete(COLLECTION_TABLE, {"id": id}).then(() => Promise.resolve(id))
    }
}