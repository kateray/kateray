const request = require('supertest')
const app = require('../src/app')

describe('Test the root path', () => {
  test('It should respond with a 200', async () => {
    const response = await request(app).get('/')
    expect(response.statusCode).toBe(200)
  })
})

describe('Test a random path', () => {
  test('It should give a 200', async () => {
    const response = await request(app).get('/fishes')
    expect(response.statusCode).toBe(200)
  })
})
