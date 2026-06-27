import { escapeText } from "./basic.js"
import { Dialog } from "./dialog.js"
import { ensureCSS } from "./network.js"
import { staticUrl } from "./settings.js"

export interface FAQQuestion extends Array<string | { hasImage?: boolean }> {
    0: string
    1: string
}

export interface FAQDialogOptions {
    title?: string
    questions?: FAQQuestion[]
}

const faqTemplate = ({
    escapedQuestions
}: {
    escapedQuestions: [string, string][]
}) =>
    `<div class="fw-faq">
    <ol class="fw-faq-list">
        ${escapedQuestions
            .map(
                question => `<li class="fw-faq-item">
                <div>
                    <div class="fw-faq-question fw-button fw-light"><i class="fa-solid fa-plus-circle"></i>${question[0]}</div>
                    <div class="fw-faq-answer" style="display: none;">${question[1]}</div>
                </div>
            </li>`
            )
            .join("")}
    </ol>
</div>`

export class faqDialog {
    faqDialog: Dialog

    constructor({ title = "", questions = [] }: FAQDialogOptions = {}) {
        ensureCSS(staticUrl("css/faq_dialog.css"))
        const escapedQuestions: [string, string][] = []

        questions.forEach(q => {
            const question = escapeText(q[0])
            let answer: string
            q[1] = escapeText(q[1])
            if ((q[q.length - 1] as { hasImage?: boolean }).hasImage) {
                // TODO: the original runtime spreads the tail of the question
                // array into interpolate; keep this behavior but type loosely.
                answer = (interpolate as any)(...q.slice(1, q.length), true)
            } else {
                answer = q[1]
            }
            escapedQuestions.push([question, answer])
        })

        this.faqDialog = new Dialog({
            title: title,
            body: faqTemplate({ escapedQuestions }),
            height: 600,
            width: 900,
            buttons: []
        })
    }

    open(): void {
        this.faqDialog.open()
        this.faqDialog
            .dialogEl!.querySelectorAll(".fw-faq-question")
            .forEach(element => {
                element.addEventListener("click", () => {
                    const iconEle = element.firstElementChild as HTMLElement
                    const answerEle = element.nextElementSibling as HTMLElement
                    if (answerEle.style.display == "") {
                        iconEle.classList.remove("fa-minus-circle")
                        iconEle.classList.add("fa-plus-circle")
                        answerEle.style.display = "none"
                    } else if (answerEle.style.display == "none") {
                        iconEle.classList.remove("fa-plus-circle")
                        iconEle.classList.add("fa-minus-circle")
                        answerEle.style.display = ""
                    }
                })
            })
    }
}
