//@flow
import DynamoDBDao from "./DynamoDBDao"
import User from "../entity/User"

import uuid from 'uuid'
import IndexDefinition from "../IndexDefinition"

export const USER_TABLE = "User"

export class DynamoDBDataService {

    dao: DynamoDBDao

    constructor(region: string, endpoint: string) {
        this.dao = new DynamoDBDao(region, endpoint)
    }

    init(): Promise<void> {
        // Note: DynamoDB secondary indexes don't guarantee uniqueness
        const secondaryIndex = [new IndexDefinition("email", "string")]
        return this.dao.createTable('User', secondaryIndex)
    }

    saveUser(user: User): Promise<User> {
        const id = uuid.v1()
        const fields = {"email": user.email}

        user.id = id

        return this.dao.insert(USER_TABLE, {"id": id}, fields).then(() => Promise.resolve(user))
    }
}