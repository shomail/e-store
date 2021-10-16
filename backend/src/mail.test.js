const mail = require("./mail")
// @ponicode
describe("mail.makeEmail", () => {
    test("0", () => {
        let callFunction = () => {
            mail.makeEmail("foo bar")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction = () => {
            mail.makeEmail("This is a Text")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction = () => {
            mail.makeEmail("Foo bar")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction = () => {
            mail.makeEmail("Hello, world!")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction = () => {
            mail.makeEmail(undefined)
        }
    
        expect(callFunction).not.toThrow()
    })
})
