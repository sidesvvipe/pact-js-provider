const { Verifier } = require("@pact-foundation/pact")
const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised)
const { server, importData, animalRepository } = require("../provider.js")
const path = require("path")

server.listen(8081, () => {
  importData()
  console.log("Animal Profile Service listening on http://localhost:8081")
})

// Verify that the provider meets all consumer expectations
describe("Pact Verification", () => {
  it("validates the expectations of Matching Service", () => {
    let token = "INVALID TOKEN"

    let opts = {
      provider: "Animal Profile Service",
      logLevel: "DEBUG",
      providerBaseUrl: "http://localhost:8081",

      requestFilter: (req, res, next) => {
        console.log(
          "Middleware invoked before provider API - injecting Authorization token"
        )
        req.headers["MY_SPECIAL_HEADER"] = "my special value"

        // e.g. ADD Bearer token
        req.headers["authorization"] = `Bearer ${token}`
        next()
      },

      stateHandlers: {
        "Has no animals": () => {
          animalRepository.clear()
          token = "1234"
          return Promise.resolve(`Animals removed to the db`)
        },
        "Has some animals": () => {
          token = "1234"
          importData()
          return Promise.resolve(`Animals added to the db`)
        },
        "Has an animal with ID 1": () => {
          token = "1234"
          importData()
          return Promise.resolve(`Animals added to the db`)
        },
        "is not authenticated": () => {
          token = ""
          Promise.resolve(`Invalid bearer token generated`)
        },
      },

      // Fetch pacts from broker
      pactBrokerUrl: "https://test.pact.dius.com.au/",

      // Fetch from broker with given tags
      consumerVersionTag: ["prod"],

      // Tag provider with given tags
      providerVersionTag: ["prod"],

      // Find _all_ pacts (not just latest) with tag prod
      //   consumerVersionSelectors: [{
      //     tag: "prod",
      //     all: true
      //   }
      // ],

      // Enables "pending pacts" feature
      enablePending: true,

      // Specific Remote pacts (doesn't need to be a broker)
      // pactUrls: ['https://test.pact.dius.com.au/pacts/provider/Animal%20Profile%20Service/consumer/Matching%20Service/latest'],
      // Local pacts
      // pactUrls: [
      //   path.resolve(
      //     process.cwd(),
      //     "./pacts/matching_service-animal_profile_service.json"
      //   ),
      // ],

      // If you're NOT using Pactflow, use the username/password option as per below
      pactBrokerUsername: "dXfltyFMgNOFZAxr8io9wJ37iUpY42M",
      pactBrokerPassword: "O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1",

      // if you're using Pactflow, you must authenticate using the bearer token option
      // You can obtain the token from https://<your broker>.pact.dius.com.au/settings/api-tokens
      // pactBrokerToken: "<insert your token here"
      publishVerificationResult: true,
      providerVersion: "1.0.0",
    }

    return new Verifier(opts).verifyProvider().then(output => {
      console.log("Pact Verification Complete!")
      console.log(output)
    })
  })
})
