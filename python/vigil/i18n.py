"""
i18n.py - Multilingual Clinical Callback Scripts with English Back-Translation
(c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
"""
import json
from pathlib import Path
from typing import Dict, Any

LANGUAGES = ["en", "fr", "es", "ar", "pt", "sw"]

SCRIPTS = {
    "P01": {
        "en": {
            "lang": "en",
            "direction": "ltr",
            "call_script": "Hello, this is Harbourview General Hospital calling for Martha Reeve regarding a recent lab test. Please could Martha or their carer contact our clinical nurse coordinator on 0800-427-268 today.",
            "sms_draft": "Harbourview General Hospital: Please call 0800-427-268 regarding a recent test result for Martha Reeve.",
            "english_back_translation": "Hello, this is Harbourview General Hospital calling for Martha Reeve regarding a recent lab test. Please could Martha or their carer contact our clinical nurse coordinator on 0800-427-268 today."
        },
        "fr": {
            "lang": "fr",
            "direction": "ltr",
            "call_script": "Bonjour, ici l'Hôpital Général Harbourview pour Martha Reeve concernant un examen biologique récent. Merci de rappeler sans délai notre coordinateur au 0800-427-268 aujourd'hui.",
            "sms_draft": "Hôpital Harbourview : Merci de contacter le 0800-427-268 concernant un résultat récent pour Martha Reeve.",
            "english_back_translation": "Hello, this is Harbourview General Hospital for Martha Reeve regarding a recent biological test. Thank you for calling back our coordinator without delay on 0800-427-268 today."
        },
        "es": {
            "lang": "es",
            "direction": "ltr",
            "call_script": "Hola, le llamamos del Hospital General Harbourview para Martha Reeve en relación con un análisis de laboratorio reciente. Rogamos se comunique hoy con nuestro coordinador al 0800-427-268.",
            "sms_draft": "Hospital General Harbourview: Por favor llame al 0800-427-268 sobre un resultado reciente de Martha Reeve.",
            "english_back_translation": "Hello, we are calling from Harbourview General Hospital for Martha Reeve regarding a recent lab test. Please contact our coordinator today on 0800-427-268."
        },
        "ar": {
            "lang": "ar",
            "direction": "rtl",
            "call_script": "مرحباً، هذا مستشفى هاربورفيو العام يتصل بشأن مارثا ريف بخصوص نتيجة تحليل مخبري حديثة. يرجى من مارثا أو مقدم الرعاية الاتصال بمنسق التمريض السريري على الرقم 0800-427-268 اليوم.",
            "sms_draft": "مستشفى هاربورفيو العام: يرجى الاتصال بالرقم 0800-427-268 بخصوص نتيجة تحليل حديثة لمارثا ريف.",
            "english_back_translation": "Hello, this is Harbourview General Hospital calling regarding Martha Reeve about a recent lab test result. Please have Martha or the caregiver contact the clinical nurse coordinator at 0800-427-268 today."
        },
        "pt": {
            "lang": "pt",
            "direction": "ltr",
            "call_script": "Olá, aqui é do Hospital Geral Harbourview contactando sobre Martha Reeve relativo a um exame recente. Solicitamos que entre em contacto com a nossa equipa pelo 0800-427-268 hoje.",
            "sms_draft": "Hospital Harbourview: Por favor ligue para 0800-427-268 sobre o resultado recente de Martha Reeve.",
            "english_back_translation": "Hello, this is Harbourview General Hospital contacting about Martha Reeve regarding a recent exam. We request you contact our team on 0800-427-268 today."
        },
        "sw": {
            "lang": "sw",
            "direction": "ltr",
            "call_script": "Hujambo, hili ni Shirika la Afya la Harbourview General linalopiga simu kwa Martha Reeve kuhusu majibu ya vipimo vya maabara. Tafadhali wasiliana na muuguzi mratibu kwa 0800-427-268 leo.",
            "sms_draft": "Harbourview General Hospital: Tafadhali piga simu 0800-427-268 kuhusu majibu ya vipimo vya Martha Reeve.",
            "english_back_translation": "Hello, this is Harbourview General Health Organization calling for Martha Reeve regarding lab test results. Please contact the coordinating nurse at 0800-427-268 today."
        }
    },
    "R01": {
        "en": {
            "lang": "en",
            "direction": "ltr",
            "call_script": "Hello, this is Harbourview General Hospital calling for Amina Diallo. We are following up on your outpatient oncology consultation referral to ensure an appointment date has been scheduled.",
            "sms_draft": "Harbourview General: Following up on your oncology referral. Please call our scheduling team on 0800-427-268.",
            "english_back_translation": "Hello, this is Harbourview General Hospital calling for Amina Diallo. We are following up on your outpatient oncology consultation referral to ensure an appointment date has been scheduled."
        },
        "fr": {
            "lang": "fr",
            "direction": "ltr",
            "call_script": "Bonjour, ici l'Hôpital Général Harbourview pour Amina Diallo. Nous faisons le suivi de votre consultation en oncologie afin de nous assurer qu'un rendez-vous a bien été fixé.",
            "sms_draft": "Hôpital Harbourview : Suivi de votre consultation en oncologie. Merci de joindre le 0800-427-268.",
            "english_back_translation": "Hello, this is Harbourview General Hospital for Amina Diallo. We are following up on your oncology consultation to ensure an appointment has been scheduled."
        },
        "es": {
            "lang": "es",
            "direction": "ltr",
            "call_script": "Hola, llamamos del Hospital General Harbourview para Amina Diallo. Damos seguimiento a su derivación para oncología ambulatoria para asegurar que tenga cita asignada.",
            "sms_draft": "Hospital Harbourview: Seguimiento de su interconsulta oncológica. Llame al 0800-427-268.",
            "english_back_translation": "Hello, we are calling from Harbourview General Hospital for Amina Diallo. We are following up on your outpatient oncology referral to ensure an appointment has been assigned."
        },
        "ar": {
            "lang": "ar",
            "direction": "rtl",
            "call_script": "مرحباً، هذا مستشفى هاربورفيو العام يتصل بشأن أمينة ديالو. نتابع معكم بخصوص تحويلكم لعيادة الأورام الخارجية للتأكد من حجز موعد المراجعة.",
            "sms_draft": "مستشفى هاربورفيو: متابعة تحويلكم لعيادة الأورام. يرجى الاتصال على 0800-427-268.",
            "english_back_translation": "Hello, this is Harbourview General Hospital calling regarding Amina Diallo. We are following up on your outpatient oncology referral to ensure your review appointment is booked."
        },
        "pt": {
            "lang": "pt",
            "direction": "ltr",
            "call_script": "Olá, aqui é do Hospital Geral Harbourview contactando Amina Diallo. Estamos a fazer o seguimento do seu encaminhamento de oncologia para assegurar a sua consulta.",
            "sms_draft": "Hospital Harbourview: Seguimento do seu encaminhamento de oncologia. Ligue para 0800-427-268.",
            "english_back_translation": "Hello, this is Harbourview General Hospital contacting Amina Diallo. We are following up on your oncology referral to ensure your consultation."
        },
        "sw": {
            "lang": "sw",
            "direction": "ltr",
            "call_script": "Hujambo, hili ni Shirika la Afya la Harbourview General linalopiga simu kwa Amina Diallo. Tunafuatilia rufaa yako ya kliniki ya saratani ili kuhakikisha tarehe ya miadi imepangwa.",
            "sms_draft": "Harbourview General: Ufuatiliaji wa rufaa yako ya saratani. Piga 0800-427-268.",
            "english_back_translation": "Hello, this is Harbourview General Health Organization calling for Amina Diallo. We are following up on your cancer clinic referral to ensure the appointment date is scheduled."
        }
    }
}

def export_i18n_files(base_dir: Path):
    i18n_dir = base_dir / "data" / "i18n"
    for lang in LANGUAGES:
        lang_dir = i18n_dir / lang
        lang_dir.mkdir(parents=True, exist_ok=True)
        for pid in ["P01", "R01"]:
            data = SCRIPTS[pid][lang]
            (lang_dir / f"{pid}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    base = Path(__file__).resolve().parent.parent.parent
    export_i18n_files(base)
    print(f"[PASS] Exported multilingual scripts for {LANGUAGES} across P01 and R01.")
