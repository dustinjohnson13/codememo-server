//@flow
import {FakeDataService} from "./FakeDataService";
import {CardDetail, CollectionResponse, Deck, DeckResponse} from "./APIDomain";

let {describe, it, expect} = global;

describe('FakeDataService', () => {

    const serviceWithNoDecks = () => new FakeDataService(undefined, []);
    const serviceWithDefaultDecks = () => new FakeDataService();

    it('can be constructed with an explict list of decks', () => {
        serviceWithNoDecks().fetchCollection().then((actual: CollectionResponse) => {
            expect(actual).toEqual(new CollectionResponse([]));
        });
    });

    it('can add new deck', () => {
        serviceWithNoDecks().addDeck("My New Deck").then((actual: CollectionResponse) => {
            expect(actual).toEqual(new CollectionResponse([new Deck('deck-1', "My New Deck", 0, 0, 0)]));
        });
    });

    it('can add new card', () => {
        const deckId = "deck-1";
        const question = 'The question';
        const answer = 'The answer';

        serviceWithDefaultDecks().addCard(deckId, question, answer).then((actual: CardDetail) => {
            expect(actual.id).toMatch(/^deck-1-card-\d$/);
            expect(actual.question).toEqual(question);
            expect(actual.answer).toEqual(answer);
            expect(actual.due).toEqual(null);
        });
    });

    it('can fetch deck by id', () => {
        const deckId = 'deck-2';

        serviceWithDefaultDecks().fetchDeck(deckId).then((actual: DeckResponse) => {
            expect(actual.id).toEqual(deckId);
            expect(actual.name).toEqual('Deck2');
            expect(actual.cards.length).toEqual(80);
        });
    });

});