const express = require('express');

const app = express();

app.use(express.json());

/**
 * Middlewares:
 */
var projects = [];

function withdraw(request, response, next){

    const {type, origin, amount} = request.body;

    if(type == 'withdraw'){

        const eventIndex = projects.findIndex(evento => evento.destination == origin);

        const refreshValues = projects[eventIndex].amount - amount

        const evento = {
            destination: origin,
            type,
            amount: refreshValues
        };

        projects[eventIndex] = evento;

        return response.status(201).json({ "origin": {"id":origin, "balance":refreshValues} });
    }

    return next();
}

function transfer(request, response, next){

    const {type, origin, amount, destination} = request.body;

    if(type == 'transfer'){

        const originAccount = projects.findIndex(evento => evento.destination == origin);

        const destinationAccount = projects.findIndex(evento => evento.destination == destination);

        //Deduct from the origin
        const originBalance = projects[originAccount].amount - amount

        const destinationBalance = projects[destinationAccount].amount + amount

        const evento1 = {
            destination: origin,
            type,
            amount: originBalance
        };

        const evento2 = {
            destination: destination,
            type,
            amount: destinationBalance
        };

        projects[originAccount] = evento1;

        projects[destinationAccount] = evento2;

        return response.status(201).json({ "origin": {"id":origin, "balance": originBalance}, "destination": {"id": destination, "balance": destinationBalance} });
    }

    return next();
}

function verifyIfAccountExists(request, response, next){

    const {type} = request.body;

    if(type == 'withdraw'){
        const {type, origin, amount} = request.body;

        const verifyOrigin = projects.findIndex(evento => evento.destination === origin);

        if(verifyOrigin < 0){
            const balance = 0
            return response.status(404).send(balance.toString());
        }
    }

    if(type == 'transfer'){
        const {type, origin, amount, destination} = request.body;

        const verifyOrigin = projects.findIndex(evento => evento.destination === origin);

        const destinationAccount = projects.findIndex(evento => evento.destination == destination);

        if(verifyOrigin < 0 || destinationAccount < 0){
            const balance = 0
            return response.status(404).send(balance.toString());
        }
    }

    return next();
}

/**
 * API
 */
app.listen(3333, () => {
    console.log('🚀 MiniBank started!');
});

//Get all the accounts
app.get('/', (request, response ) => {
    return response.json(projects);
});

app.get('/balance', (request, response) => {
    const account_id = request.query.account_id;

    const eventIndexVerify = projects.findIndex(evento => evento.destination === account_id);

    if(eventIndexVerify < 0){
        const balance = 0
        return response.status(404).send(balance.toString());
    }

    const actualBalance = projects[eventIndexVerify].amount
    return response.status(200).send(actualBalance.toString())
    
});

//Create account with initial balance
app.post('/event', verifyIfAccountExists, withdraw, transfer, (request, response) => {

    const {type, destination, amount} = request.body;

    const eventIndex = projects.findIndex(evento => evento.destination == destination);

    if(eventIndex < 0){
        //Create account with a deposit
        const evento = { destination, type, amount };

        projects.push(evento);

        return response.status(201).json({ "destination": {"id":destination, "balance":amount} });
    }else{
        
        //Make a deposit in a exist
        const refreshValues = projects[eventIndex].amount + amount

        const evento = {
            destination,
            type,
            amount: refreshValues
        };

        projects[eventIndex] = evento;

        return response.status(201).json({ "destination": {"id":destination, "balance":refreshValues} });
    }
});

//Create account with initial balance
app.post('/reset', (request, response) => {

    projects = [];

    return response.status(200).send("OK")
});