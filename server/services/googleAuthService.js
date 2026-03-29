import { OAuth2Client } from "google-auth-library";

const clientId = "259624968087-tgkh2467e0hgpih7uq28tsrhearsi9q7.apps.googleusercontent.com"

const client = new OAuth2Client({
    clientId
})

export async function verifyIdToken(idToken){
    const loginTicket = await client.verifyIdToken({
        idToken,
        audience: clientId
    })
    const userData = loginTicket.getPayload()
    return userData
}