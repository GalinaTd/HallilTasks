'use strict';

//browser-sync start --server, -s
const mainContent = document.querySelector('#content');

document.querySelector('#add-new')
    .addEventListener('click', (e) => {
        window.location.hash = '#';
        getModalContent();

    });

document.querySelector('[href="#list"]')
    .addEventListener('click', (e) => {
        window.location.hash = '#list';
        getListFilms();
    });

window.addEventListener('hashchange', (e) => {
    const Path = window.location.hash;
    if (Path.includes('#list-')) { //переход на полное описание с фильмом
        const idFilm = Path.substr(Path.indexOf('-') + 1);
        getInfoFilm(idFilm);
    }
    if (Path.includes('#list')) {
        document.getElementById('searchtxt').value = '';
    }

});

document.getElementById('searchtxt')
    .addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        window.location.hash = 'search';
        getListFilms(query);
    });

document.getElementById('search')
    .addEventListener('submit', (e) => {
        e.preventDefault(); //остановка отправки на сервер       
        window.location.hash = 'search';
    });


// показ инфы по одному фильму после перехода по ссылке подробнее
function getInfoFilm(idFilm) {
    fetch('./movie.html')
        .then(res => res.text())
        .then(dataHtml => {
            const filmData = JSON.parse(localStorage.getItem(`Film_${idFilm}`));
            let htmlText = '';

            htmlText = template(filmData[0], dataHtml);
            mainContent.innerHTML = htmlText;

            const listStars = document.querySelector('.list-unstyled');
            const listTeam = document.querySelector('.pl-0');

            filmData.forEach((el, ind) => {
                if (el.stars) {
                    let starsLi = '';
                    el.stars.forEach((star, ind) => {
                        starsLi += `<li>${star}</li>`;
                    });
                    listStars.innerHTML = starsLi;
                }
                let listItem = '';

                if (el.team) {
                    for (let key in el.team) {
                        if (key.includes('teampost')) {
                            listItem += `<li class="d-flex team"><p class="col-3">${el.team[key]}</p>`;
                        }
                        if (key.includes('teamname')) {
                            listItem += `<p class="col-9">${el.team[key]}</p></li>`;
                        }
                    }
                    listTeam.insertAdjacentHTML('beforeend', listItem);
                }

            })
            document.querySelector('.movie-details')
                .addEventListener('click', (e) => {
                    if (e.target.closest('.like')) {
                        filmData[0].like = Number(filmData[0].like) + 1;
                        e.target.closest('.like').dataset.count = filmData[0].like;
                    }
                    if (e.target.closest('.dislike')) {
                        filmData[0].dislike = Number(filmData[0].dislike) + 1;
                        e.target.closest('.dislike').dataset.count = filmData[0].dislike;
                    }

                    localStorage.setItem('Film_' + idFilm, JSON.stringify(filmData));
                }, { once: true }); //once: true вызов только 1 раз и можно поставить только 1 лайк или 1 дизлайк

        });
};

function getModalContent(idFilm) {
    fetch('./add-new.html')
        .then(res => res.text())
        .then(data => {

            teamCounter.reset();

            dataFileToString = '';
            mainContent.innerHTML = data;
            const addNewModal = document.querySelector('#addNewModal');
            $(addNewModal).modal('show');

            document.forms[1].addEventListener('submit', (e) => {
                e.preventDefault(); //остановка отправки на сервер                        
                handlingModal(e.target, idFilm);
            });

            const posterFile = document.forms[1].elements.poster;
            const customFileLabel = document.querySelector('.custom-file-label');
            const img = document.querySelector('img');
            posterFile.addEventListener('change', (e) => {
                const fileList = e.target;
                customFileLabel.textContent = fileList.files[0].name;
                previewFile(img, fileList.files[0]); //превью картинки    
            });

            $(addNewModal).on('hidden.bs.modal', function (e) {
                addNewModal.remove();
            });
            //обработка добавления в команду
            document.querySelector('.btn-add-field')
                .addEventListener('click', (e) => {

                    const inputNode = document.querySelectorAll('.teamlist input');
                    const indLast = inputNode.length - 1;
                    const nameInputLast = inputNode[indLast].name;
                    const numLastInput = Number(nameInputLast.substr(nameInputLast.indexOf('_') + 1));

                    if (indLast > 1) {
                        addTeamPrint(idFilm, numLastInput + 1);
                    } else {
                        addTeamPrint(idFilm);
                    }
                });

            document.querySelector('.teamlist')
                .addEventListener('click', (e) => {

                    const el = e.target.closest('.btn-remove-field');
                    if (el && !e.target.closest('#ban')) {
                        e.target.closest('[id]').remove();
                    }
                });
            if (idFilm) {
                loadFilmModal(idFilm, document.forms[1], img, customFileLabel);
            }
        });
};

function template(data, tpl) {
    const f = (strings, ...values) => strings.reduce((res, item, index) => {
        return index === strings.length - 1 ?
            res += `${item}` :
            res += `${item}${data[values[index]]}`;
    }, '');
    return eval('f`' + tpl + '`');
};

function getListFilms(queryTxt) {
    fetch('./card.html')
        .then(res => res.text())
        .then(data => {

            const listFilmsData = JSON.parse(localStorage.listFilms);

            let htmlText = '';
            listFilmsData.forEach((el, ind) => {
                if (queryTxt) {  //есть запрос на поиск
                    if (el.title.toLowerCase().includes(queryTxt) || el.description.toLowerCase().includes(queryTxt)) {
                        htmlText += template(el, data);
                    }

                } else {
                    htmlText += template(el, data);
                }

            });

            mainContent.innerHTML = htmlText;            

            const cardFilms = document.querySelectorAll('.mt-3');
            cardFilms.forEach((el, ind) => {
                el.addEventListener('click', (e) => {
                    const idFilm = el.id;
                    if (e.target.closest('.btn-edit')) {
                        getModalContent(el.id);
                    }
                    if (e.target.closest('.btn-delete')) {
                        removeFilmStorage(el.id);
                    }

                })
            })

        })
        .catch(error => alert('В Local Storage нет фильмов'));
};

//загрузка информации в модалку при корректировке фильма
function loadFilmModal(idFilm, form, imgEl, labelFile) {
    const filmData = JSON.parse(localStorage.getItem(`Film_${idFilm}`));

    [...form.elements].forEach(function (el) {
        if (el.name && el.name !== 'poster') {
            el.value = filmData[0][el.name];
        }
        if (el.name === 'teampost' || el.name === 'teamname') {
            el.value = filmData[0].team[el.name];
        }
    });

    //Array.prototype.forEach.call(form.elements, function (el) {
    //    console.log(el);
    //});    

    //загрузка постера
    fetch(filmData[0].poster)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], filmData[0].namefile, { type: "image/png", type: "image/jpeg" })
            labelFile.textContent = filmData[0].namefile;
            dataFileToString = '';
            previewFile(imgEl, file);
        });

    // load team
    for (let key in filmData[0].team) {
        if (key !== 'teampost' && key !== 'teamname') {
            if (key.includes('teampost_')) {
                let num = key.substr(key.indexOf('_') + 1);
                addTeamPrint(idFilm, num); //рисую кнопки                             
            }
            form.elements[key].value = filmData[0].team[key];
        }
    }
};

function removeFilmStorage(idFilm) {
    let isRemove = confirm('Вы действительно хотите удалить фильм?');
    if (isRemove) {
        localStorage.removeItem(`Film_${idFilm}`);//удаляю фильм из сторежда
        const listFilmStorage = JSON.parse(localStorage.listFilms);

        listFilmStorage.forEach((el, ind) => {
            if (Number(el.id) === Number(idFilm)) {
                listFilmStorage.splice(ind, 1);// удаляю фильм из списка с фильмами            
            }
        })

        localStorage.listFilms = JSON.stringify(listFilmStorage);
        getListFilms();//обновляю страницу со списком фильмов
    }

};

function makeCounter(initialVal, step) {
    let currentCount = initialVal;
    function counter() {
        return currentCount += step;
    }
    counter.reset = function (val = initialVal) { //сброс счетчика, по умолчанию сброс до initialVal, иначе val
        currentCount = val;
    }
    return counter;
};

const teamCounter = makeCounter(0, 1); //счетчик для добавления в команду

function addTeamPrint(idFilm, teamNum) {
    const addTeam = document.querySelector('.teamlist');
    const idTeam = Date.now();
    let numTeam;

    if (Number.isInteger(+idFilm) && Number.isInteger(+teamNum)) {
        numTeam = teamNum;
    } else {
        numTeam = teamCounter();
    }

    const textHtml = `
    <div id=${idTeam} class="form-group row">
    <div class="col-sm-5">
      <input name="teampost_${numTeam}" type="text" class="form-control" placeholder="Должность">
    </div>
    <div class="col-sm-5">
      <input name="teamname_${numTeam}" type="text" class="form-control" placeholder="Имя">
    </div>
    <div class="col-sm-2">
      <button class="btn btn-danger btn-sm btn-remove-field" type="button" data-ident="${idTeam}"><svg class="octicon octicon-x"
      viewBox="0 0 14 18" version="1.1" width="14" height="18" aria-hidden="true">
      <path fill-rule="evenodd"
        d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48L7.48 8z">
      </path>
    </svg></button>
    </div>
    </div>`;

    addTeam.insertAdjacentHTML('beforeend', textHtml);

};

let dataFileToString = '';

function previewFile(elImg, file) {
    const reader = new FileReader();
    reader.onloadend = function () {
        elImg.src = reader.result; // элемент img с превью       
        dataFileToString = reader.result;
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
    }
}

function handlingModal(form, filmId) {
    let idFilm;
    const addNewModal = document.querySelector('#addNewModal'); //модалка
    const formObj = new FormData(form);
    const object = {};

    let teamObj = {};

    formObj.forEach(function (value, key) {
        if (key.includes('teampost') || key.includes('teamname')) {
            teamObj[key] = value;
        } else {
            object[key] = value;
        }
    });

    if (filmId) {
        idFilm = filmId //корректировка фильма
    } else {
        idFilm = Date.now();// добавление нового фильма
    }

    const StoredFilm = [{
        title: object.title,
        origtitle: object.origtitle,
        namefile: document.querySelector('.custom-file-label').textContent,
        poster: dataFileToString, //постер в формате строка
        releaseyear: object.releaseyear,
        country: object.country,
        tagline: object.tagline,
        director: object.director,
        team: teamObj,
        stars: object.stars.split(','),
        rating: object.rating,
        description: object.description,
        like: 0,
        dislike: 0
    }];

    const listFilms = localStorage.listFilms ? JSON.parse(localStorage.listFilms) : [];

    listFilms.forEach((el, ind) => {
        if (Number(el.id) === Number(idFilm)) {
            listFilms.splice(ind, 1);
        }

    });
    listFilms.push({
        id: String(idFilm),
        title: object.title,
        poster: dataFileToString,
        description: object.description,
        rating: object.rating
    })

    localStorage.setItem('Film_' + idFilm, JSON.stringify(StoredFilm));
    localStorage.listFilms = JSON.stringify(listFilms);

    $(addNewModal).modal("hide");
    addNewModal.remove();
    teamCounter.reset();
    getListFilms();


}








