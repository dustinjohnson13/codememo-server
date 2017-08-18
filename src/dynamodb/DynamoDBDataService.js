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

    updateUser(user: User): Promise<User> {
        const id = user.id

        const updates = new Map()
        updates.set("email", user.email)

        if (!id) {
            throw new Error("User must have id specified.")
        }

        return this.dao.update(USER_TABLE, {"id": id}, [updates]).then(() => Promise.resolve(user))
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

    updateCard(card: Card): Promise<Card> {
        const id = card.id

        if (!id) {
            throw new Error("Card must have id specified.")
        }

        const updates = new Map()
        updates.set("q", card.question)
        updates.set("a", card.answer)
        updates.set("d", card.due)

        return this.dao.update(CARD_TABLE, {"id": id}, [updates]).then(() => Promise.resolve(card))
    }

    saveDeck(deck: Deck): Promise<Deck> {
        const id = uuid.v1()
        const fields: Object = {"n": deck.name, "c": deck.cards}

        deck.id = id

        return this.dao.insert(DECK_TABLE, {"id": id}, fields).then(() => Promise.resolve(deck))
    }

    updateDeck(deck: Deck): Promise<Deck> {
        const id = deck.id

        if (!id) {
            throw new Error("Deck must have id specified.")
        }

        const updates = new Map()
        updates.set("n", deck.name)
        updates.set("c", deck.cards)

        return this.dao.update(DECK_TABLE, {"id": id}, [updates]).then(() => Promise.resolve(deck))
    }

    saveCollection(collection: Collection): Promise<Collection> {
        const fields: Object = {"d": collection.decks}

        if (!collection.id) {
            throw new Error("Collections must have the user id specified as the id.")
        }

        return this.dao.insert(COLLECTION_TABLE, {"id": collection.id}, fields).then(() => Promise.resolve(collection))
    }

    updateCollection(collection: Collection): Promise<Collection> {
        const id = collection.id

        const updates = new Map()
        updates.set("d", collection.decks)

        return this.dao.update(COLLECTION_TABLE, {"id": id}, [updates]).then(() => Promise.resolve(collection))
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

    findUser(id: string): Promise<User> {
        return this.dao.findOne(USER_TABLE, {"id": id}).then((data) =>
            Promise.resolve(new User(data.Item.id, data.Item.email))
        )
    }

    findCard(id: string): Promise<Card> {
        return this.dao.findOne(CARD_TABLE, {"id": id}).then((data) =>
            Promise.resolve(new Card(data.Item.id, data.Item.q, data.Item.a, data.Item.d))
        )
    }

    findDeck(id: string): Promise<Deck> {
        return this.dao.findOne(DECK_TABLE, {"id": id}).then((data) =>
            Promise.resolve(new Deck(data.Item.id, data.Item.n, data.Item.c))
        )
    }

    findCollection(id: string): Promise<Collection> {
        return this.dao.findOne(COLLECTION_TABLE, {"id": id}).then((data) =>
            Promise.resolve(new Collection(data.Item.id, data.Item.d))
        )
    }
}