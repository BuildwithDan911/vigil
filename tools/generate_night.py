#!/usr/bin/env python3
"""Generate synthetic Harbourview General HL7 traffic for Vigil Night Shift.

Stdlib only. See kit/samples/generator-spec.md.
"""
from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

FIELD = "|"
COMP = "^"
HOSP = "HARBOURVIEW"
NIGHT_START = datetime(2026, 11, 4, 19, 0, 0)


def ts(dt: datetime) -> str:
    return dt.strftime("%Y%m%d%H%M%S")


def msh(msg_type: str, msgid: str, dt: datetime) -> str:
    return FIELD.join(
        [
            "MSH",
            r"^~\&",
            "VIGILGEN",
            HOSP,
            "EHR",
            HOSP,
            ts(dt),
            "",
            msg_type,
            msgid,
            "P",
            "2.5",
        ]
    )


def pid(patient: dict) -> str:
    name = f"{patient['family']}^{patient['given']}"
    return FIELD.join(
        [
            "PID",
            "1",
            "",
            f"{patient['id']}^^^HVG^MR",
            "",
            name,
            "",
            patient["dob"],
            patient["sex"],
            "",
            "",
            "",
            "",
            "",
            "",
        ]
    )


def pv1(ward: str, admit: datetime, discharge: datetime | None, visit: str) -> str:
    parts = ["PV1", "1", "I", ward, "", "", "", "OKONKWO^ADA", "", "", "", "", "", "", "", "", "", "", visit]
    # pad to PV1-44/45
    while len(parts) < 45:
        parts.append("")
    parts[44] = ts(admit)  # PV1-44 admit
    if discharge is not None:
        while len(parts) < 46:
            parts.append("")
        parts[45] = ts(discharge)
    return FIELD.join(parts)


def evn(event: str, dt: datetime) -> str:
    return FIELD.join(["EVN", event, ts(dt)])


def obr(accession: str, test: str, code: str, dt: datetime) -> str:
    return FIELD.join(
        [
            "OBR",
            "1",
            accession,
            accession,
            f"{code}^{test}^LN",
            "",
            "",
            ts(dt),
        ]
    )


def obx(set_id: int, code: str, name: str, value: str, units: str, ref: str, flag: str) -> str:
    return FIELD.join(
        [
            "OBX",
            str(set_id),
            "NM" if _is_number(value) else "ST",
            f"{code}^{name}^LN",
            "",
            str(value),
            units,
            ref,
            flag,
            "",
            "",
            "F",
        ]
    )


def _is_number(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


def join_hl7(segments: list[str]) -> str:
    return "\r".join(segments) + "\r"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def years_to_dob(age: int, at: datetime) -> str:
    return (at.replace(year=at.year - age) - timedelta(days=20)).strftime("%Y%m%d")


def build_patients() -> list[dict]:
    rnd = random.Random(20261105)
    named = [
        dict(id="P01", given="Martha", family="Reeve", age=78, sex="F", lives_alone=True, ward="4W",
             share_results_sms=True, share_sensitive=True, story="hh_potassium_elderly_alone"),
        dict(id="P02", given="Samuel", family="Okai", age=67, sex="M", lives_alone=False, ward="CCU",
             share_results_sms=True, share_sensitive=True, story="hh_troponin"),
        dict(id="P03", given="Amina", family="Diallo", age=82, sex="F", lives_alone=True, ward="5E",
             share_results_sms=True, share_sensitive=True, story="h_creatinine"),
        dict(id="P04", given="Ben", family="Cole", age=41, sex="M", lives_alone=False, ward="2S",
             share_results_sms=True, share_sensitive=True, story="h_cholesterol"),
        dict(id="P05", given="Leah", family="Nkrumah", age=29, sex="F", lives_alone=False, ward="2S",
             share_results_sms=True, share_sensitive=True, story="normal_cbc"),
        dict(id="P06", given="Ibrahim", family="Sane", age=55, sex="M", lives_alone=False, ward="3N",
             share_results_sms=True, share_sensitive=True, story="inpatient_only"),
        dict(id="P07", given="Nora", family="Peters", age=60, sex="F", lives_alone=False, ward="3N",
             share_results_sms=True, share_sensitive=True, story="result_before_discharge"),
        dict(id="P08", given="Owen", family="Burke", age=50, sex="M", lives_alone=False, ward="2S",
             share_results_sms=True, share_sensitive=True, story="stale_sodium"),
        dict(id="P09", given="Chika", family="Eze", age=36, sex="F", lives_alone=False, ward="IDW",
             share_results_sms=True, share_sensitive=False, story="hiv_redact"),
        dict(id="P10", given="Yusuf", family="Bello", age=44, sex="M", lives_alone=True, ward="PSY",
             share_results_sms=False, share_sensitive=True, story="lithium_hold"),
        dict(id="P11", given="Martha", family="Reeve", age=78, sex="F", lives_alone=True, ward="4W",
             share_results_sms=True, share_sensitive=True, story="duplicate_p01"),
        dict(id="P12", given="Tariq", family="Hassan", age=22, sex="M", lives_alone=False, ward="2S",
             share_results_sms=True, share_sensitive=True, story="hh_potassium_young_stale"),
        dict(id="P13", given="Maya", family="Owusu", age=7, sex="F", lives_alone=False, ward="PED",
             share_results_sms=True, share_sensitive=True, story="pediatric_hb"),
        dict(id="P14", given="Grace", family="Mensah", age=70, sex="F", lives_alone=True, ward="4W",
             share_results_sms=True, share_sensitive=True, story="offshift_glucose"),
        dict(id="P15", given="Kwame", family="Asante", age=76, sex="M", lives_alone=True, ward="4W",
             share_results_sms=True, share_sensitive=True, story="multi_obx_hh"),
    ]
    first = ["Ada", "Kojo", "Lila", "Noel", "Zara", "Hugo", "Ife", "Pia", "Omar", "Nia",
             "Theo", "Esi", "Rafi", "Bisi", "Jules", "Hana", "Luc", "Amara", "Seth", "Ines",
             "Paul", "Rita", "Wale", "Sia", "Ken"]
    last = ["Addo", "Boateng", "Kone", "Traore", "Ibrahim", "Nwosu", "Adeyemi", "Kamara",
            "Gebre", "Mwangi", "Okoye", "Toure", "Jallow", "Banerjee", "Silva"]
    extras = []
    for i in range(16, 41):
        extras.append(
            dict(
                id=f"P{i:02d}",
                given=first[i - 16],
                family=last[i % len(last)],
                age=rnd.choice([19, 24, 31, 38, 45, 52, 58, 64, 71, 80]),
                sex=rnd.choice(["F", "M"]),
                lives_alone=bool(rnd.randint(0, 1)),
                ward=rnd.choice(["2S", "3N", "4W", "5E"]),
                share_results_sms=True,
                share_sensitive=True,
                story="filler",
            )
        )
    out = []
    for p in named + extras:
        p = dict(p)
        p["dob"] = years_to_dob(p["age"], NIGHT_START)
        out.append(p)
    return out


def adt_pair(patient: dict, admit: datetime, discharge: datetime | None, visit: str) -> list[tuple[str, str]]:
    files = []
    a01 = join_hl7(
        [msh("ADT^A01", f"{patient['id']}A01", admit), evn("A01", admit), pid(patient), pv1(patient["ward"], admit, None, visit)]
    )
    files.append((f"{patient['id']}-adt-a01.hl7", a01))
    if discharge is not None:
        a03 = join_hl7(
            [msh("ADT^A03", f"{patient['id']}A03", discharge), evn("A03", discharge), pid(patient), pv1(patient["ward"], admit, discharge, visit)]
        )
        files.append((f"{patient['id']}-adt-a03.hl7", a03))
    return files


def oru(patient: dict, accession: str, dt: datetime, observations: list[tuple], extra_pid: dict | None = None) -> str:
    person = extra_pid or patient
    segs = [msh("ORU^R01", accession, dt), pid(person), obr(accession, observations[0][1], observations[0][0], dt)]
    for i, (code, name, value, units, ref, flag) in enumerate(observations, start=1):
        segs.append(obx(i, code, name, value, units, ref, flag))
    return join_hl7(segs)


def replay_decision(accession: str, urgency: str, owner: str, reason: str, script: str, sms: str, consent: str) -> dict:
    return {
        "urgency": urgency,
        "owner": owner,
        "reason": reason,
        "call_script": script,
        "sms_draft": sms,
        "consent_recommendation": consent,
        "confidence": 0.86,
        "_meta": {
            "recorded": True,
            "accession": accession,
            "model": "replay",
            "tokens": 0,
            "promptVersion": "loop-decision-v1",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=Path("data"))
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    out: Path = args.out
    patients = build_patients()
    by_id = {p["id"]: p for p in patients}

    adt_dir = out / "night" / "adt"
    oru_dir = out / "night" / "oru"
    replay_dir = out / "replay" / "decisions"
    for folder in (adt_dir, oru_dir, replay_dir):
        folder.mkdir(parents=True, exist_ok=True)

    public_patients = []
    for p in patients:
        row = {k: p[k] for k in ("id", "given", "family", "age", "sex", "lives_alone", "ward",
                                  "share_results_sms", "share_sensitive", "story", "dob")}
        public_patients.append(row)
    (out / "patients.json").write_text(json.dumps(public_patients, indent=2) + "\n", encoding="utf-8")

    answer = {
        "ruleVersion": "1.0.0",
        "night_start": NIGHT_START.isoformat(),
        "cases": {},
        "without_vigil_never_called": [],
    }

    def add_case(cid: str, **kwargs):
        answer["cases"][cid] = kwargs
        if kwargs.get("opens_loop") is True:
            answer["without_vigil_never_called"].append(cid)

    # Time anchors
    # P01 discharged yesterday afternoon, result tonight
    p = by_id["P01"]
    admit, discharge, result = NIGHT_START - timedelta(days=3), NIGHT_START - timedelta(hours=20), NIGHT_START + timedelta(hours=1)
    for name, text in adt_pair(p, admit, discharge, "V001"):
        write(adt_dir / name, text)
    acc = "ACC-P01-K"
    write(oru_dir / "P01-oru.hl7", oru(p, acc, result, [("K", "Potassium", "6.8", "mmol/L", "3.5-5.1", "HH")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "critical", "dr.mensah",
        "Potassium is critically high the day after Martha Reeve went home, and she lives alone.",
        "Hello, this is Harbourview General. I am calling about Martha Reeve's recent blood test. Please could she or her carer phone us today on 0000 000 000.",
        "Harbourview General: please call us today about a recent blood test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P01", accession=acc, final_level="critical", opens_loop=True, escalates_if_ignored=True, consent="send")

    p = by_id["P02"]
    admit, discharge, result = NIGHT_START - timedelta(days=2), NIGHT_START - timedelta(hours=6), NIGHT_START + timedelta(hours=2)
    for name, text in adt_pair(p, admit, discharge, "V002"):
        write(adt_dir / name, text)
    acc = "ACC-P02-TNI"
    write(oru_dir / "P02-oru.hl7", oru(p, acc, result, [("TNI", "Troponin I", "2.4", "ng/mL", "0.00-0.04", "HH")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "critical", "dr.okonkwo",
        "A very high troponin came back after Samuel Okai was discharged.",
        "Hello, this is Harbourview General calling Samuel Okai about a recent heart-blood test. Please phone us now on 0000 000 000.",
        "Harbourview General: please call us now about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P02", accession=acc, final_level="critical", opens_loop=True, consent="send")

    p = by_id["P03"]
    admit, discharge, result = NIGHT_START - timedelta(days=6), NIGHT_START - timedelta(days=3), NIGHT_START + timedelta(hours=3)
    for name, text in adt_pair(p, admit, discharge, "V003"):
        write(adt_dir / name, text)
    acc = "ACC-P03-CREAT"
    write(oru_dir / "P03-oru.hl7", oru(p, acc, result, [("CREAT", "Creatinine", "3.1", "mg/dL", "0.5-1.2", "H")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.okonkwo",
        "Creatinine is high three days after discharge for an 82-year-old who lives alone.",
        "Hello, this is Harbourview General calling Amina Diallo about a recent kidney test. Please phone us today on 0000 000 000.",
        "Harbourview General: please call us today about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P03", accession=acc, final_level="urgent", opens_loop=True, consent="send")

    p = by_id["P04"]
    admit, discharge, result = NIGHT_START - timedelta(days=16), NIGHT_START - timedelta(days=10), NIGHT_START + timedelta(hours=4)
    for name, text in adt_pair(p, admit, discharge, "V004"):
        write(adt_dir / name, text)
    acc = "ACC-P04-CHOL"
    write(oru_dir / "P04-oru.hl7", oru(p, acc, result, [("CHOL", "Cholesterol", "6.2", "mmol/L", "0-5.2", "H")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "routine", "dr.okonkwo",
        "Cholesterol is a little high ten days after discharge; a routine call is enough.",
        "Hello, this is Harbourview General calling Ben Cole about a recent cholesterol result. Please phone us this week on 0000 000 000.",
        "Harbourview General: please call us this week about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P04", accession=acc, final_level="routine", opens_loop=True, consent="send")

    p = by_id["P05"]
    admit, discharge, result = NIGHT_START - timedelta(days=4), NIGHT_START - timedelta(days=2), NIGHT_START + timedelta(hours=5)
    for name, text in adt_pair(p, admit, discharge, "V005"):
        write(adt_dir / name, text)
    acc = "ACC-P05-CBC"
    write(oru_dir / "P05-oru.hl7", oru(p, acc, result, [("WBC", "White blood cells", "6.1", "10*9/L", "4.0-11.0", "N")]))
    add_case("P05", accession=acc, final_level="no_action", opens_loop=False)

    p = by_id["P06"]
    admit = NIGHT_START - timedelta(days=1)
    for name, text in adt_pair(p, admit, None, "V006"):
        write(adt_dir / name, text)
    acc = "ACC-P06-K"
    write(oru_dir / "P06-oru.hl7", oru(p, acc, NIGHT_START + timedelta(hours=2, minutes=10),
                                       [("K", "Potassium", "5.6", "mmol/L", "3.5-5.1", "H")]))
    add_case("P06", accession=acc, final_level="skip", opens_loop=False, skip_reason="not_discharged")

    p = by_id["P07"]
    admit, discharge, result = NIGHT_START - timedelta(days=2), NIGHT_START + timedelta(hours=8), NIGHT_START + timedelta(hours=1, minutes=30)
    for name, text in adt_pair(p, admit, discharge, "V007"):
        write(adt_dir / name, text)
    acc = "ACC-P07-K"
    write(oru_dir / "P07-oru.hl7", oru(p, acc, result, [("K", "Potassium", "5.7", "mmol/L", "3.5-5.1", "H")]))
    add_case("P07", accession=acc, final_level="skip", opens_loop=False, skip_reason="result_before_discharge")

    p = by_id["P08"]
    admit, discharge, result = NIGHT_START - timedelta(days=50), NIGHT_START - timedelta(days=40), NIGHT_START + timedelta(hours=6)
    for name, text in adt_pair(p, admit, discharge, "V008"):
        write(adt_dir / name, text)
    acc = "ACC-P08-NA"
    write(oru_dir / "P08-oru.hl7", oru(p, acc, result, [("NA", "Sodium", "147", "mmol/L", "135-145", "A")]))
    add_case("P08", accession=acc, final_level="no_action_or_routine", opens_loop="optional_low", notes="stale mild abnormality; do not treat as critical")

    p = by_id["P09"]
    admit, discharge, result = NIGHT_START - timedelta(days=5), NIGHT_START - timedelta(days=2), NIGHT_START + timedelta(hours=7)
    for name, text in adt_pair(p, admit, discharge, "V009"):
        write(adt_dir / name, text)
    acc = "ACC-P09-HIVVL"
    write(oru_dir / "P09-oru.hl7", oru(p, acc, result, [("HIVVL", "HIV viral load", "120000", "copies/mL", "0-20", "H")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.okonkwo",
        "A sensitive viral-load result returned after discharge. The patient asked us not to share sensitive details by text.",
        "Hello, this is Harbourview General calling Chika Eze. Please phone the clinic today on 0000 000 000 about a recent test.",
        "Harbourview General. Please call the clinic about a recent test. Do not include the test name or the value.",
        "redact",
    ), indent=2))
    add_case("P09", accession=acc, final_level="urgent", opens_loop=True, consent="redact", forbidden_outbound=["HIV", "120000"])

    p = by_id["P10"]
    admit, discharge, result = NIGHT_START - timedelta(days=4), NIGHT_START - timedelta(days=1, hours=12), NIGHT_START + timedelta(hours=8)
    for name, text in adt_pair(p, admit, discharge, "V010"):
        write(adt_dir / name, text)
    acc = "ACC-P10-LI"
    write(oru_dir / "P10-oru.hl7", oru(p, acc, result, [("LI", "Lithium", "1.6", "mmol/L", "0.6-1.2", "H")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.okonkwo",
        "Lithium is above range after discharge, and this patient asked not to be texted.",
        "Hello, this is Harbourview General calling Yusuf Bello. Please phone us today on 0000 000 000.",
        "",
        "hold",
    ), indent=2))
    add_case("P10", accession=acc, final_level="urgent", opens_loop=True, consent="hold")

    # P11 duplicate of P01 accession
    p = by_id["P01"]
    write(oru_dir / "P11-oru-duplicate.hl7", oru(p, "ACC-P01-K", NIGHT_START + timedelta(hours=1, minutes=20),
                                                [("K", "Potassium", "6.8", "mmol/L", "3.5-5.1", "HH")]))
    add_case("P11", accession="ACC-P01-K", final_level="critical", opens_loop=False, dedupe_of="P01")

    p = by_id["P12"]
    admit, discharge, result = NIGHT_START - timedelta(days=28), NIGHT_START - timedelta(days=21), NIGHT_START + timedelta(hours=9)
    for name, text in adt_pair(p, admit, discharge, "V012"):
        write(adt_dir / name, text)
    acc = "ACC-P12-K"
    write(oru_dir / "P12-oru.hl7", oru(p, acc, result, [("K", "Potassium", "6.5", "mmol/L", "3.5-5.1", "HH")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.okonkwo",
        "The potassium flag is still critically high, so urgency stays at least urgent even three weeks later in a young adult.",
        "Hello, this is Harbourview General calling Tariq Hassan about a recent blood test. Please phone us today on 0000 000 000.",
        "Harbourview General: please call us today about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P12", accession=acc, final_level="urgent", floor="urgent", opens_loop=True, consent="send")

    p = by_id["P13"]
    admit, discharge, result = NIGHT_START - timedelta(days=3), NIGHT_START - timedelta(hours=22), NIGHT_START + timedelta(hours=10)
    for name, text in adt_pair(p, admit, discharge, "V013"):
        write(adt_dir / name, text)
    acc = "ACC-P13-HB"
    write(oru_dir / "P13-oru.hl7", oru(p, acc, result, [("HB", "Hemoglobin", "8.2", "g/dL", "11.5-14.5", "L")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.okonkwo",
        "A child has a low hemoglobin the day after going home.",
        "Hello, this is Harbourview General calling about Maya Owusu's recent blood test. Please could a parent phone us today on 0000 000 000.",
        "Harbourview General: please call us today about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P13", accession=acc, final_level="urgent", opens_loop=True, consent="send")

    p = by_id["P14"]
    admit, discharge, result = NIGHT_START - timedelta(days=3), NIGHT_START - timedelta(hours=18), NIGHT_START + timedelta(hours=1, minutes=45)
    for name, text in adt_pair(p, admit, discharge, "V014"):
        write(adt_dir / name, text)
    acc = "ACC-P14-GLU"
    write(oru_dir / "P14-oru.hl7", oru(p, acc, result, [("GLU", "Glucose", "22", "mmol/L", "3.9-6.1", "H")]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "urgent", "dr.mensah",
        "Glucose is high the evening after discharge and the usual daytime owner is off shift.",
        "Hello, this is Harbourview General calling Grace Mensah about a recent sugar test. Please phone us tonight on 0000 000 000.",
        "Harbourview General: please call us tonight about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P14", accession=acc, final_level="urgent", opens_loop=True, owner="dr.mensah", consent="send")

    p = by_id["P15"]
    admit, discharge, result = NIGHT_START - timedelta(days=2), NIGHT_START - timedelta(hours=16), NIGHT_START + timedelta(hours=11)
    for name, text in adt_pair(p, admit, discharge, "V015"):
        write(adt_dir / name, text)
    acc = "ACC-P15-MULTI"
    write(oru_dir / "P15-oru.hl7", oru(p, acc, result, [
        ("WBC", "White blood cells", "7.2", "10*9/L", "4.0-11.0", "N"),
        ("K", "Potassium", "6.9", "mmol/L", "3.5-5.1", "HH"),
    ]))
    write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
        acc, "critical", "dr.okonkwo",
        "A critically high potassium sits next to an otherwise normal blood count after discharge.",
        "Hello, this is Harbourview General calling Kwame Asante about a recent blood test. Please phone us today on 0000 000 000.",
        "Harbourview General: please call us today about a recent test on 0000 000 000.",
        "send",
    ), indent=2))
    add_case("P15", accession=acc, final_level="critical", opens_loop=True, consent="send")

    rnd = random.Random(40)
    for i in range(16, 41):
        pid_ = f"P{i:02d}"
        p = by_id[pid_]
        admit = NIGHT_START - timedelta(days=rnd.randint(2, 8), hours=rnd.randint(0, 10))
        if i % 7 == 0:
            # still admitted fillers
            for name, text in adt_pair(p, admit, None, f"V{i:03d}"):
                write(adt_dir / name, text)
            acc = f"ACC-{pid_}-IN"
            write(oru_dir / f"{pid_}-oru.hl7", oru(p, acc, NIGHT_START + timedelta(hours=rnd.randint(1, 20)),
                                                   [("K", "Potassium", "4.2", "mmol/L", "3.5-5.1", "N")]))
            add_case(pid_, accession=acc, final_level="skip", opens_loop=False, skip_reason="not_discharged")
            continue
        discharge = admit + timedelta(days=1, hours=6)
        result = discharge + timedelta(hours=rnd.randint(4, 30))
        for name, text in adt_pair(p, admit, discharge, f"V{i:03d}"):
            write(adt_dir / name, text)
        flag = "N" if i % 3 else "H"
        value = "4.1" if flag == "N" else "5.4"
        acc = f"ACC-{pid_}-K"
        write(oru_dir / f"{pid_}-oru.hl7", oru(p, acc, result, [("K", "Potassium", value, "mmol/L", "3.5-5.1", flag)]))
        opens = flag != "N" and p["age"] >= 64
        level = "routine" if opens else "no_action"
        add_case(pid_, accession=acc, final_level=level, opens_loop=opens)
        if opens:
            write(replay_dir / f"{acc}.json", json.dumps(replay_decision(
                acc, "routine", "dr.okonkwo",
                f"A mildly high potassium returned after discharge for {p['given']} {p['family']}.",
                f"Hello, this is Harbourview General calling {p['given']} {p['family']} about a recent blood test. Please phone us on 0000 000 000.",
                "Harbourview General: please call us about a recent test on 0000 000 000.",
                "send",
            ), indent=2))


    # --- Referral leakage planted cases ---
    ref_dir = out / "night" / "referral"
    ref_dir.mkdir(parents=True, exist_ok=True)
    referrals = [
        {
            "case_id": "R01",
            "referralId": "REF-ONC-001",
            "patientId": "P03",
            "referredTo": "Harbourview Oncology",
            "specialty": "oncology",
            "sentAt": (NIGHT_START - __import__("datetime").timedelta(hours=60)).isoformat(),
            "bookingStatus": "none",
            "share_results_sms": True,
            "expected_action": "chase",
            "opens_loop": True,
            "final_level": "urgent",
        },
        {
            "case_id": "R02",
            "referralId": "REF-ORT-002",
            "patientId": "P04",
            "referredTo": "City Orthopaedics",
            "specialty": "orthopaedics",
            "sentAt": (NIGHT_START - __import__("datetime").timedelta(hours=80)).isoformat(),
            "bookingStatus": "booked",
            "share_results_sms": True,
            "expected_action": None,
            "opens_loop": False,
            "final_level": "skip",
        },
        {
            "case_id": "R03",
            "referralId": "REF-CAR-003",
            "patientId": "P02",
            "referredTo": "Harbourview Cardiology",
            "specialty": "cardiology",
            "sentAt": (NIGHT_START - __import__("datetime").timedelta(hours=55)).isoformat(),
            "bookingStatus": "none",
            "share_results_sms": True,
            "expected_action": "chase",
            "opens_loop": True,
            "final_level": "urgent",
        },
        {
            "case_id": "R04",
            "referralId": "REF-PSY-004",
            "patientId": "P10",
            "referredTo": "Community Mental Health",
            "specialty": "psychiatry",
            "sentAt": (NIGHT_START - __import__("datetime").timedelta(hours=96)).isoformat(),
            "bookingStatus": "none",
            "share_results_sms": False,
            "expected_action": "chase",
            "opens_loop": True,
            "final_level": "urgent",
            "consent": "hold",
        },
    ]
    for ref in referrals:
        write(ref_dir / f"{ref['case_id']}.json", json.dumps(ref, indent=2) + "\n")
        add_case(ref["case_id"], loop_type="referral_leakage", **{k: ref[k] for k in ref if k != "case_id"})
        if ref.get("opens_loop"):
            acc = ref["referralId"]
            write(
                replay_dir / f"{acc}.json",
                json.dumps(
                    replay_decision(
                        acc,
                        ref["final_level"],
                        "dr.okonkwo",
                        f"Referral to {ref['referredTo']} was sent but never booked.",
                        f"Hello, this is Harbourview General calling about a specialist appointment that still needs booking. Please phone us on 0000 000 000.",
                        "" if ref.get("consent") == "hold" else "Harbourview General: please call us to book your specialist appointment on 0000 000 000.",
                        ref.get("consent", "send"),
                    ),
                    indent=2,
                )
                + "\n",
            )


    template = {
        "hospital": "Harbourview General",
        "notice": "Public planted-case index. Private expected answers are in data/answer-key.json and must never be committed.",
        "ruleVersion": "1.0.0",
        "planted_case_ids": [f"P{i:02d}" for i in range(1, 16)],
        "categories": {
            "must_open_critical": ["P01", "P02", "P15"],
            "must_not_open_loop": ["P05", "P06", "P07"],
            "consent_redact": ["P09"],
            "consent_hold": ["P10"],
            "dedupe": ["P11"],
            "must_escalate_if_ignored": ["P01"],
            "referral_must_open": ["R01", "R03", "R04"],
            "referral_must_not_open": ["R02"],
        },
    }
    (out / "answer-key.template.json").write_text(json.dumps(template, indent=2) + "\n", encoding="utf-8")

    key_path = out / "answer-key.json"
    if key_path.exists() and not args.force:
        print(f"Leaving existing {key_path} in place (pass --force to overwrite)")
    else:
        key_path.write_text(json.dumps(answer, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote private answer key to {key_path} (git-ignore this file)")

    print(f"Patients: {len(patients)}")
    print(f"ADT files: {len(list(adt_dir.glob('*.hl7')))}")
    print(f"ORU files: {len(list(oru_dir.glob('*.hl7')))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
