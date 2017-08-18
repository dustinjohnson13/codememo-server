//@flow
import {loadCollectionData, REGION, startAndLoadData, stop} from './DynamoDBHelper'
import {
    CARD_TABLE,
    COLLECTION_TABLE,
    DECK_TABLE,
    DynamoDBDataService,
    USER_TABLE
} from "../../src/dynamodb/DynamoDBDataService"
import User from "../../src/entity/User"
import Card from "../../src/entity/Card"
import Deck from "../../src/entity/Deck"
import Collection from "../../src/entity/Collection"

const {describe, it, expect,} = global
const AWS = require("aws-sdk")

describe('DynamoDBDataService', () => {

    let port
    let service

    beforeEach(async () => {
        await startAndLoadData(false).then((assignedPort: number) => {
            port = assignedPort
            service = new DynamoDBDataService(REGION, `http://localhost:${port}`)
        }).then(() => {
            return service.init()
        }).catch((err) => {
            console.log("Error!")
            throw err
        })
    })

    afterEach(() => {
        stop(port)
    })

    it('should be able to create a user', (done) => {
        expect.assertions(2)

        const user = new User(undefined, "blah@somewhere.com")

        service.saveUser(user).then((user) => {

            expect(user.id).toBeDefined()

            const docClient = new AWS.DynamoDB.DocumentClient()

            const params = {
                TableName: USER_TABLE,
                Key: {
                    "id": user.id
                }
            }

            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                } else {
                    expect(data.Item.email).toEqual(user.email)
                    done()
                }
            })
        })
    })

    // it('should not be able to create multiple users with the same email', (done) => {
    //     expect.assertions(2)
    //
    //     const email = "blah@somewhere.com"
    //     const user = new User(undefined, email)
    //
    //     return service.saveUser(user)
    //         .then((user) => expect(user.id).toBeDefined())
    //         .then(() => service.saveUser(new User(undefined, email)))
    //         .catch((err) => {
    //             expect(err).toEqual(`User blah@somewhere.com already exists.`)
    //             done()
    //         })
    // })

    it('should be able to create a card', (done) => {
        expect.assertions(8)

        const entity = new Card(undefined, "Question 1?", "Answer 1?", undefined)
        const entity2 = new Card(undefined, "Question 2?", "Answer 2?", 20999)
        const entities = [entity, entity2]

        const persist = Promise.all(entities.map((card) => service.saveCard(card)))

        return persist.then((persisted: Array<Card>) => {

            const originalById = new Map(entities.map((i) => [i.id, i]))

            persisted.forEach((entity, idx) => {

                expect(entity.id).toBeDefined()

                const docClient = new AWS.DynamoDB.DocumentClient()

                const params = {
                    TableName: CARD_TABLE,
                    Key: {
                        "id": entity.id
                    }
                }

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    } else {
                        const original = originalById.get(data.Item.id)
                        if (original) {
                            expect(data.Item.q).toEqual(original.question)
                            expect(data.Item.a).toEqual(original.answer)
                            expect(data.Item.d).toEqual(original.due)
                        }
                        if (idx === 1) {
                            done()
                        }
                    }
                })
            })
        })
    })

    it('should be able to create a deck', (done) => {
        expect.assertions(3)

        const entity = new Deck(undefined, 'Some Name', ['card-1', 'card-2'])

        service.saveDeck(entity).then((entity) => {

            expect(entity.id).toBeDefined()

            const docClient = new AWS.DynamoDB.DocumentClient()

            const params = {
                TableName: DECK_TABLE,
                Key: {
                    "id": entity.id
                }
            }

            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                } else {
                    expect(data.Item.n).toEqual(entity.name)
                    expect(data.Item.c).toEqual(entity.cards)
                    done()
                }
            })
        })
    })

    it('should be able to create a collection', (done) => {
        expect.assertions(1)

        const entity = new Collection('some-id', ['deck-1', 'deck-2'])

        service.saveCollection(entity).then((entity) => {

            const docClient = new AWS.DynamoDB.DocumentClient()

            const params = {
                TableName: COLLECTION_TABLE,
                Key: {
                    "id": entity.id
                }
            }

            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                } else {
                    expect(data.Item.d).toEqual(entity.decks)
                    done()
                }
            })
        })
    })

    it('should be able to delete a user', (done) => {
        expect.assertions(1)

        loadCollectionData(port).then(() => {

            const id = "d1eda90c-8413-11e7-bb31-be2e44b06b34"

            service.deleteUser(id).then((user) => {

                const docClient = new AWS.DynamoDB.DocumentClient()

                const params = {
                    TableName: USER_TABLE,
                    Key: {
                        "id": id
                    }
                }

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    } else {
                        expect(data.Item).toBeUndefined()
                        done()
                    }
                })
            })
        })
    })

    it('should be able to delete a card', (done) => {
        expect.assertions(1)

        loadCollectionData(port).then(() => {

            const id = "7c7a2ddc-8414-11e7-bb31-be2e44b06b34"

            service.deleteCard(id).then((id) => {

                const docClient = new AWS.DynamoDB.DocumentClient()

                const params = {
                    TableName: CARD_TABLE,
                    Key: {
                        "id": id
                    }
                }

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    } else {
                        expect(data.Item).toBeUndefined()
                        done()
                    }
                })
            })
        })
    })

    it('should be able to delete a deck', (done) => {
        expect.assertions(1)

        loadCollectionData(port).then(() => {

            const id = "ff279d7e-8413-11e7-bb31-be2e44b06b34"

            service.deleteDeck(id).then((id) => {

                const docClient = new AWS.DynamoDB.DocumentClient()

                const params = {
                    TableName: DECK_TABLE,
                    Key: {
                        "id": id
                    }
                }

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    } else {
                        expect(data.Item).toBeUndefined()
                        done()
                    }
                })
            })
        })
    })

    it('should be able to delete a collection', (done) => {
        expect.assertions(1)

        loadCollectionData(port).then(() => {

            const id = "d1eda90c-8413-11e7-bb31-be2e44b06b34"

            service.deleteCollection(id).then((id) => {

                const docClient = new AWS.DynamoDB.DocumentClient()

                const params = {
                    TableName: COLLECTION_TABLE,
                    Key: {
                        "id": id
                    }
                }

                docClient.get(params, function (err, data) {
                    if (err) {
                        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    } else {
                        expect(data.Item).toBeUndefined()
                        done()
                    }
                })
            })
        })
    })
})