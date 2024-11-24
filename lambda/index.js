const Alexa = require('ask-sdk-core');

// Función para dividir palabras en sílabas correctamente
function dividirEnSilabas(palabra) {
    const vocales = 'aeiouáéíóúü';
    const consonantesDobles = ['rr', 'll', 'ch'];
    const silabas = [];
    let buffer = '';
    let i = 0;

    if (!palabra || typeof palabra !== 'string') {
        throw new Error('Se esperaba una palabra válida como cadena de texto.');
    }

    palabra = palabra.toLowerCase().trim();

    while (i < palabra.length) {
        const letra = palabra[i];
        const siguiente = palabra[i + 1] || '';
        const siguienteDos = palabra[i + 2] || '';

        buffer += letra;

        if (consonantesDobles.includes(letra + siguiente)) {
            buffer += siguiente;
            i++;
        }

        if (vocales.includes(letra)) {
            if (!vocales.includes(siguiente)) {
                silabas.push(buffer);
                buffer = '';
            } else if (vocales.includes(letra) && vocales.includes(siguiente) && vocales.includes(siguienteDos)) {
                buffer += siguiente + siguienteDos;
                silabas.push(buffer);
                buffer = '';
                i += 2;
            } else if (vocales.includes(siguiente)) {
                buffer += siguiente;
                silabas.push(buffer);
                buffer = '';
                i++;
            }
        }

        if (i === palabra.length - 1 && buffer) {
            silabas.push(buffer);
            buffer = '';
        }

        i++;
    }

    return silabas.join('<break time="500ms"/>');
}

// Manejador para LaunchRequest
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = '¡Hola! Bienvenido a tu asistente para practicar hablar. Dime una palabra y te ayudaré a practicar pronunciándola por sílabas.';
        handlerInput.attributesManager.setSessionAttributes({ lastSpeech: speakOutput });
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Por favor dime una palabra para practicar.')
            .getResponse();
    }
};

// Manejador para PracticarIntent
const PracticarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PracticarIntent';
    },
    handle(handlerInput) {
        try {
            const palabra = handlerInput.requestEnvelope.request &&
                handlerInput.requestEnvelope.request.intent &&
                handlerInput.requestEnvelope.request.intent.slots &&
                handlerInput.requestEnvelope.request.intent.slots.palabra &&
                handlerInput.requestEnvelope.request.intent.slots.palabra.value;

            if (!palabra) {
                const speakOutput = 'No entendí la palabra. Por favor dime una palabra para practicar.';
                handlerInput.attributesManager.setSessionAttributes({ lastSpeech: speakOutput });
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt('Por favor dime una palabra para practicar.')
                    .getResponse();
            }

            const silabas = dividirEnSilabas(palabra);
            const speakOutput = `Vamos a practicar. Escucha y repite después de mí: ${silabas}. ¿Te gustaría practicar otra palabra?`;

            handlerInput.attributesManager.setSessionAttributes({ lastSpeech: speakOutput });
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Por favor, di "sí" o "no".')
                .getResponse();
        } catch (error) {
            console.error('Error procesando el intent PracticarIntent:', error);
            const speakOutput = 'Hubo un error al procesar tu palabra. Por favor intenta de nuevo.';
            handlerInput.attributesManager.setSessionAttributes({ lastSpeech: speakOutput });
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('¿Podrías repetir la palabra?')
                .getResponse();
        }
    }
};

// Manejador para ConfirmarPracticaIntent
const ConfirmarPracticaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfirmarPracticaIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const respuesta = slots &&
            slots.respuesta &&
            slots.respuesta.value;

        console.log('Respuesta recibida:', respuesta); // Depuración

        // Normalizar la respuesta para manejar variantes con y sin acento
        const respuestaNormalizada = respuesta ? respuesta.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

        if (respuestaNormalizada === 'si') {
            const speakOutput = 'Perfecto, dime otra palabra para practicar.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('¿Qué palabra quieres practicar?')
                .getResponse();
        } else if (respuestaNormalizada === 'no') {
            const speakOutput = 'Entendido. Cuando quieras practicar de nuevo, solo pídemelo. ¡Hasta luego!';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .getResponse();
        } else {
            const speakOutput = 'No entendí tu respuesta. Por favor, di "sí" para continuar o "no" para salir.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('¿Quieres practicar otra palabra? Di "sí" o "no".')
                .getResponse();
        }
    }
};



// Manejador para SessionEndedRequest
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Sesión terminada: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// Manejador para errores
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error(`~~~~ Error manejado: ${error.message}`);
        const speakOutput = 'Lo siento, ocurrió un problema. Por favor intenta de nuevo.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Por favor intenta de nuevo.')
            .getResponse();
    }
};

// Exporta el manejador principal
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        PracticarIntentHandler,
        ConfirmarPracticaIntentHandler, // Nuevo manejador agregado
        SessionEndedRequestHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
