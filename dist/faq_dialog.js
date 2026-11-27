import { escapeText } from "./basic.js";
import { Dialog } from "./dialog.js";
import { ensureCSS } from "./network.js";
import { staticUrl } from "./settings.js";
const faqTemplate = ({ escapedQuestions }) => `<div class="fw-faq">
    <ol class="fw-faq-list">
        ${escapedQuestions
    .map(question => `<li class="fw-faq-item">
                <div>
                    <div class="fw-faq-question fw-button fw-light"><i class="fa-solid fa-plus-circle"></i>${question[0]}</div>
                    <div class="fw-faq-answer" style="display: none;">${question[1]}</div>
                </div>
            </li>`)
    .join("")}
    </ol>
</div>`;
export class faqDialog {
    constructor({ title = "", questions = [] } = {}) {
        ensureCSS(staticUrl("css/fwtoolkit/faq_dialog.css"));
        const escapedQuestions = [];
        questions.forEach(q => {
            const question = escapeText(q[0]);
            let answer;
            q[1] = escapeText(q[1]);
            if (q[q.length - 1].hasImage) {
                // The tail of the question array (between the template and the
                // hasImage marker) holds the positional arguments for the answer
                // template. Pass them to interpolate with named substitution
                // enabled.
                answer = interpolate(q[1], q.slice(2, q.length - 1), true);
            }
            else {
                answer = q[1];
            }
            escapedQuestions.push([question, answer]);
        });
        this.faqDialog = new Dialog({
            title: title,
            body: faqTemplate({ escapedQuestions }),
            height: 600,
            width: 900,
            buttons: []
        });
    }
    open() {
        this.faqDialog.open();
        this.faqDialog
            .dialogEl.querySelectorAll(".fw-faq-question")
            .forEach(element => {
            element.addEventListener("click", () => {
                const iconEle = element.firstElementChild;
                const answerEle = element.nextElementSibling;
                if (answerEle.style.display == "") {
                    iconEle.classList.remove("fa-minus-circle");
                    iconEle.classList.add("fa-plus-circle");
                    answerEle.style.display = "none";
                }
                else if (answerEle.style.display == "none") {
                    iconEle.classList.remove("fa-plus-circle");
                    iconEle.classList.add("fa-minus-circle");
                    answerEle.style.display = "";
                }
            });
        });
    }
}
//# sourceMappingURL=faq_dialog.js.map