# How to Locally Run Unit Tests in Postman

We'll use a simple hello world message to run this test for now as we don't have a PostgreSQL server running yet.

## Prerequisites

- Make sure you have a server running. For example:
    ```bash
    npm i
    npm run dev
    ```
- The server should be running on port 4001 by default

## Setting Up Tests

1. In the tests directory, there should be a JSON file called `SimpleHelloTest.postman_environment.json`
2. Download that file to your machine
3. Open up Postman and import the environment file:
    - Click on "Import" in the top left
    - Select the downloaded JSON file
    - The environment should now appear in your environments list

## Creating and Running the Test

1. Create a new request:

    - Name it something simple like: "GET hello world"
    - Set the request type to GET
    - Enter the URL: `{{localURL}}/message/hello`

2. Add test scripts:
    - Click on the "Tests" tab in the request builder
    - Copy and paste the following test script:

```javascript
// Test for successful response
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

// Test for correct content type
pm.test('Content-Type is application/json', function () {
    pm.response.to.have.header('Content-Type');
    pm.expect(pm.response.headers.get('Content-Type')).to.include(
        'application/json'
    );
});

// Test for response body structure
pm.test('Response has correct message', function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.be.an('object');
    pm.expect(responseJson).to.have.property('message');
    pm.expect(responseJson.message).to.equal('Hello World!');
});

// Test for response time
pm.test('Response time is acceptable', function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});
```

3. Run the test:
    - Make sure your environment is selected from the dropdown in the top-right
    - Click the blue "Send" button
    - Check the "Test Results" tab in the response section
    - You should see all tests passing with green checkmarks

Congratulations! You've successfully created and run unit tests for the /message/hello API endpoint.
