
// Singleton mock object
const mock: any = {
    auth: {
        getUser: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
    },
    single: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
};

// Chainable methods returning the mock itself
mock.from = jest.fn().mockReturnValue(mock);
mock.select = jest.fn().mockReturnValue(mock);
mock.insert = jest.fn().mockReturnValue(mock);
mock.update = jest.fn().mockReturnValue(mock);
mock.delete = jest.fn().mockReturnValue(mock);
mock.eq = jest.fn().mockReturnValue(mock);
mock.neq = jest.fn().mockReturnValue(mock);
mock.gt = jest.fn().mockReturnValue(mock);
mock.lt = jest.fn().mockReturnValue(mock);
mock.gte = jest.fn().mockReturnValue(mock);
mock.lte = jest.fn().mockReturnValue(mock);
mock.like = jest.fn().mockReturnValue(mock);
mock.ilike = jest.fn().mockReturnValue(mock);
mock.is = jest.fn().mockReturnValue(mock);
mock.in = jest.fn().mockReturnValue(mock);
mock.contains = jest.fn().mockReturnValue(mock);
mock.containedBy = jest.fn().mockReturnValue(mock);
mock.range = jest.fn().mockReturnValue(mock);
mock.textSearch = jest.fn().mockReturnValue(mock);
mock.match = jest.fn().mockReturnValue(mock);
mock.not = jest.fn().mockReturnValue(mock);
mock.or = jest.fn().mockReturnValue(mock);
mock.filter = jest.fn().mockReturnValue(mock);

// Return self for chainable modifiers too
mock.order.mockReturnValue(mock);
mock.limit.mockReturnValue(mock);

export const supabase = mock;
export const supabaseAdmin = mock;
