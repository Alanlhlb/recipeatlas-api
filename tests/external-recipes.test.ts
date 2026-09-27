import request from 'supertest';
import app from '../src/app';

describe('GET /api/external-recipes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns TheMealDB recipes in the RecipeAtlas format', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        meals: [
          {
            idMeal: '52771',
            strMeal: 'Spicy Arrabiata Penne',
            strCategory: 'Vegetarian',
            strMealThumb: 'https://example.com/meal.jpg',
            strInstructions: 'Cook the pasta and prepare the sauce.',
            strIngredient1: 'penne rigate',
            strMeasure1: '1 pound',
          },
        ],
      }),
    } as Response);

    const response = await request(app).get('/api/external-recipes?q=arrabiata');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        recipes: [
          {
            source: 'TheMealDB',
            sourceId: '52771',
            title: 'Spicy Arrabiata Penne',
            category: 'Vegetarian',
            imageUrl: 'https://example.com/meal.jpg',
            instructions: 'Cook the pasta and prepare the sauce.',
            ingredients: [{ name: 'penne rigate', quantity: '1 pound' }],
          },
        ],
      },
    });
  });

  it('returns an empty list when TheMealDB has no match', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ meals: null }),
    } as Response);

    const response = await request(app).get('/api/external-recipes?q=unknown');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: { recipes: [] },
    });
  });

  it('returns a safe upstream error when TheMealDB fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network failure'));

    const response = await request(app).get('/api/external-recipes?q=pasta');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Recipe provider is unavailable',
    });
  });

  it('requires a search query', async () => {
    const response = await request(app).get('/api/external-recipes');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: 'error',
      message: 'q is required for external recipe search',
    });
  });
});
