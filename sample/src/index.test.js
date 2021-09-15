import App from "./index";
import {afterAll, beforeAll, expect, it, jest} from '@jest/globals';
import imposter from "./imposter";

const mocks = imposter();

const thirdParties = {
    stockService: {dir: 'stock-service', port: 9080},
    orderService: {dir: 'order-service', port: 9081},
};

jest.setTimeout(30000);

let app;

beforeAll(async () => {
    // spin up a mock for all third parties
    const mockInstances = [];
    for (const t in thirdParties) {
        const service = thirdParties[t];
        const configDir = `${process.cwd()}/third-party/${service.dir}`;
        mockInstances.push(
            mocks.start(configDir, service.port)
        );
    }

    // configure app with endpoints
    app = App({
        stockBaseUrl: `http://localhost:${thirdParties.stockService.port}`,
        ordersBaseUrl: `http://localhost:${thirdParties.orderService.port}`,
    })

    return Promise.all(mockInstances);
});

afterAll(async () => {
    return mocks.stopAll();
})

it('order item in stock', async () => {
    const confirmation = await app.orderItemInStock();
    expect(confirmation.total).toEqual(13.00);
});
