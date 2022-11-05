"use strict";

const slides = document.querySelectorAll(".slide");
const firstSlide = document.querySelector(".first-slide");

let index = 0;
slides[index].classList.add("active");
firstSlide.classList.add("inactive");

setInterval(() => {
  slides[index].classList.remove("active");

  index++;

  if (index === slides.length) index = 0;

  slides[index].classList.add("active");
}, 3000);
