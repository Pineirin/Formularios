contenedor = document.getElementById('preguntas-container');
addPreguntas = document.getElementById('add-pregunta');
nuevasPreguntas = document.getElementById('nuevas-preguntas');
num = 0;

function create() {
    contenedor.innerHTML =
        '<h3>Seleccione el tipo de pregunta:</h3>' +
        '<p class="uk-margin">' +
        '<button class="uk-button uk-button-danger uk-width-1-3 uk-margin-small-bottom" onclick="textOption()">' +
        'Texto' +
        '</button>' +
        '<button class="uk-button uk-button-danger uk-width-1-3 uk-margin-small-bottom" onclick="choiceOption()">' +
        'Opciones' +
        '</button>' +
        '<button class="uk-button uk-button-danger uk-width-1-3 uk-margin-small-bottom" onclick="numberOption()">' +
        'Número' +
        '</button>' +
        '</p>';
    addPreguntas.style.display = 'none';
}

function textOption() {
    nuevasPreguntas.innerHTML +=
        '<div class="uk-grid uk-margin">' +
        '<div class="uk-width-1-1">' +
        '<label class="uk-form-label">' +
        'Pregunta de tipo texto:' +
        '</label>' +
        '<input class="uk-input" type="text" name="preguntaTexto[]" placeholder="Inserte la pregunta">' +
        '</div>' +
        '</div>';
    undo();
}

function choiceOption() {
    nuevasPreguntas.innerHTML +=
        '<div class="uk-grid uk-margin">' +
        '<div class="uk-width-1-1 contenedor-opciones" id=' + num + '>' +
        '<label class="uk-form-label">' +
        'Pregunta de tipo opciones:' +
        '</label>' +
        '<input class="uk-input uk-margin-small-bottom" type="text" name="preguntaOpciones[]" placeholder="Inserte la pregunta">' +
        '<input class="uk-input uk-margin-small-bottom" type="text" name="preguntaOpciones[]" placeholder="Inserte una opción">' +
        '<button class="uk-button uk-button-danger uk-width-1-2 uk-margin-small-bottom" ' +
        'onclick="checkId(this)">Añadir otra opción' +
        '</button>' +
        '</div>' +
        '</div>';
    num = num + 1;
    undo();
}

function checkId(elem) {
    contenedorOpciones = document.getElementById(elem.parentNode.getAttribute('id'));
    boton = contenedorOpciones.getElementsByTagName("button")[0];
    contenedorOpciones.removeChild(boton);
    contenedorOpciones.innerHTML +=
        '<input class="uk-input uk-margin-small-bottom" type="text" name="preguntaOpciones[]" placeholder="Inserte una opción">' +
        '<button class="uk-button uk-button-danger uk-width-1-2 uk-margin-small-bottom" ' +
        'onclick="checkId(this)">Añadir otra opción' +
        '</button>';
}

function numberOption() {
    nuevasPreguntas.innerHTML +=
        '<div class="uk-grid uk-margin">' +
        '<div class="uk-width-1-1">' +
        '<label class="uk-form-label">' +
        'Pregunta de tipo número:' +
        '</label>' +
        '<input class="uk-input" type="text" name="preguntaNumber[]" placeholder="Inserte la pregunta">' +
        '</div>' +
        '</div>';
    undo();
}

function undo() {
    addPreguntas.style.display = 'inline';
    contenedor.innerHTML = '';
}