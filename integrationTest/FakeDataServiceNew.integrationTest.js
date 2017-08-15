//@flow
import {FakeDataService} from "../src/FakeDataService";
import {CardDetail, CollectionResponse, Deck, DeckResponse} from "../src/APIDomain";

const DynamoDbLocal = require('dynamodb-local');
const dynamoLocalPort = 8000;

let {describe, it, expect,} = global;

describe('FakeDataService2', () => {

    const serviceWithNoDecks = () => new FakeDataService(undefined, []);
    const serviceWithDefaultDecks = () => new FakeDataService();

    beforeAll(() => {
        return DynamoDbLocal.launch(dynamoLocalPort, null, []).then(() => {
            console.log("DynamoDB ready!");
        });
    });

    afterAll(() => {
        DynamoDbLocal.stop(dynamoLocalPort);
    });

    it('can be constructed with an explict list of decks', () => {
        expect.assertions(1);
        return serviceWithNoDecks().fetchCollection().then((actual: CollectionResponse) => {
            expect(actual).toEqual(new CollectionResponse([]));
        });
    });

    it('can add new deck', () => {
        expect.assertions(1);
        return serviceWithNoDecks().addDeck("My New Deck").then((actual: CollectionResponse) => {
            expect(actual).toEqual(new CollectionResponse([new Deck('deck-1', "My New Deck", 0, 0, 0)]));
        });
    });

    it('can add new card', () => {
        const deckId = "deck-1";
        const question = 'The question';
        const answer = 'The answer';

        expect.assertions(4);
        return serviceWithDefaultDecks().addCard(deckId, question, answer).then((actual: CardDetail) => {
            expect(actual.id).toMatch(/^deck-1-card-\d$/);
            expect(actual.question).toEqual(question);
            expect(actual.answer).toEqual(answer);
            expect(actual.due).toEqual(null);
        });
    });

});