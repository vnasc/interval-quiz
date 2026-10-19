"use strict";

const TRANSLATIONS = {
  en: {
    title: "Interval — a little practice, a better ear.",
    home: "Interval home",
    language: "Language",
    headerTag: "THE MUSICIAN’S DAILY PRACTICE",
    savedLocal: "Progress saved locally",
    savedSession: "Progress saved this session",
    eyebrow: "KNOW THE DISTANCE. FIND THE NOTE.",
    headline: "Small intervals.",
    headlineAccent: "Big progress.",
    intro: "Build your fretboard intuition, one note at a time.",
    training: "INTERVAL TRAINING",
    forBass: "Made for bass players",
    practice: "Your practice",
    chooseIntervals: "Choose the intervals you want to work on.",
    intervals: "INTERVALS",
    selectAll: "Select all",
    chordTones: "Chord tones",
    presetTitle: "Start with chord tones",
    presetDescription: "3rds, 5ths, and 7ths. A solid foundation.",
    usePreset: "Use chord tones",
    yourBass: "YOUR BASS",
    stringGroup: "Number of bass strings",
    strings: "{count} strings",
    tuning: "Standard tuning",
    bassLabel: "{count}-STRING BASS",
    advanceLabel: "NEXT QUESTION",
    advanceGroup: "Next question mode",
    advanceManual: "Manual",
    seconds: "{count} seconds",
    nextIn: "Next in {count}s",
    findNote: "FIND THE NOTE",
    audioOn: "Answer audio: on",
    audioOff: "Answer audio: off",
    audioAscending: "Playback: ascending (switch to descending)",
    audioDescending: "Playback: descending (switch to ascending)",
    promptBefore: "Above",
    promptAfter: ", what note is a",
    rootNote: "Root note",
    chooseAnswer: "Choose your answer",
    keyboard: "Type A–G · Shift for ♯ / ♭",
    next: "Next question",
    waiting: "No rush. Think it through.",
    or: " or ",
    circle: "Circle of fifths",
    explore: "EXPLORE",
    circleHelper: "Every note has a place.",
    intervalNote: "Interval note",
    circleWaiting: "Answer to see how the two notes connect.",
    circleTop: "CIRCLE OF",
    circleBottom: "fifths",
    circleAria: "Circle of fifths. Root {root}",
    circleTargetAria: ", interval note {target}",
    semitonesUp: "{count} semitone{plural} up",
    fretboard: "FRETBOARD",
    root: "Root",
    interval: "Interval",
    fretboardWaiting: "Find the root. Answer to reveal your interval.",
    fretboardAnswered:
      "{root} → {target}. Dashed paths 1 and 2 show two ascending interval fingerings.",
    fretboardTip:
      "Notes repeat. Explore the same interval in different positions.",
    rootPositions: "ROOT POSITIONS HIGHLIGHTED",
    targetPositions: "{targets} INTERVAL POSITIONS · {pairs} FINGERINGS",
    fretboardAria:
      "{count}-string bass fretboard, frets zero to twelve. Green notes are {root}",
    fretboardTargetAria: "; orange notes are {target}.",
    progress: "Your progress",
    reset: "Reset",
    progressHelper: "A little better with every question.",
    accuracy: "ACCURACY",
    correctLabel: "CORRECT",
    streak: "CURRENT STREAK",
    answerTime: "AVG. ANSWER TIME",
    statsEmpty: "Your first note is the start of something good.",
    statsStreak:
      "{streak} in a row. You’re finding your rhythm! Best streak: {best}.",
    statsPractice: "Every answer is practice. Best streak: {best}.",
    resetConfirm:
      "Reset all practice statistics? Your interval and bass settings will stay the same.",
    footer: "A little practice, a better ear.",
    loveMusic: "Built for the love of music",
    tritone: "tritone",
    intervalNames: {
      m2: "minor 2nd",
      M2: "major 2nd",
      m3: "minor 3rd",
      M3: "major 3rd",
      P4: "perfect 4th",
      TT: "augmented 4th / diminished 5th",
      P5: "perfect 5th",
      m6: "minor 6th",
      M6: "major 6th",
      m7: "minor 7th",
      M7: "major 7th",
    },
  },

  "pt-BR": {
    title: "Interval — um pouco de prática, um ouvido melhor.",
    home: "Página inicial do Interval",
    language: "Idioma",
    headerTag: "A PRÁTICA DIÁRIA DE QUEM TOCA",
    savedLocal: "Progresso salvo localmente",
    savedSession: "Progresso salvo nesta sessão",
    eyebrow: "ENTENDA A DISTÂNCIA. ENCONTRE A NOTA.",
    headline: "Pequenos intervalos.",
    headlineAccent: "Grande progresso.",
    intro: "Conheça melhor o braço do baixo, uma nota de cada vez.",
    training: "TREINO DE INTERVALOS",
    forBass: "Feito para baixistas",
    practice: "Sua prática",
    chooseIntervals: "Escolha os intervalos que você quer praticar.",
    intervals: "INTERVALOS",
    selectAll: "Selecionar todos",
    chordTones: "Notas do acorde",
    presetTitle: "Comece pelas notas do acorde",
    presetDescription: "Terças, quintas e sétimas. Uma boa base.",
    usePreset: "Usar notas do acorde",
    yourBass: "SEU BAIXO",
    stringGroup: "Número de cordas do baixo",
    strings: "{count} cordas",
    tuning: "Afinação padrão",
    bassLabel: "BAIXO DE {count} CORDAS",
    advanceLabel: "PRÓXIMA QUESTÃO",
    advanceGroup: "Modo de avançar para a próxima questão",
    advanceManual: "Manual",
    seconds: "{count} segundos",
    nextIn: "Próxima em {count}s",
    findNote: "ENCONTRE A NOTA",
    audioOn: "Áudio da resposta: ativado",
    audioOff: "Áudio da resposta: desativado",
    audioAscending: "Reprodução: ascendente (mudar para descendente)",
    audioDescending: "Reprodução: descendente (mudar para ascendente)",
    promptBefore: "Acima de",
    promptAfter: ", qual nota forma o intervalo de",
    rootNote: "Nota fundamental",
    chooseAnswer: "Escolha sua resposta",
    keyboard: "Digite A–G · Shift para ♯ / ♭",
    next: "Próxima questão",
    waiting: "Sem pressa. Pense com calma.",
    or: " ou ",
    circle: "Círculo de quintas",
    explore: "EXPLORE",
    circleHelper: "Cada nota tem seu lugar.",
    intervalNote: "Nota do intervalo",
    circleWaiting: "Responda para ver a ligação entre as notas.",
    circleTop: "CÍRCULO DE",
    circleBottom: "quintas",
    circleAria: "Círculo de quintas. Fundamental {root}",
    circleTargetAria: ", nota do intervalo {target}",
    semitonesUp: "{count} semitom acima",
    fretboard: "BRAÇO DO BAIXO",
    root: "Fundamental",
    interval: "Intervalo",
    fretboardWaiting:
      "Encontre a fundamental. Responda para revelar o intervalo.",
    fretboardAnswered:
      "{root} → {target}. Os caminhos tracejados 1 e 2 mostram duas formas de tocar o intervalo ascendente.",
    fretboardTip:
      "As notas se repetem. Explore o mesmo intervalo em posições diferentes.",
    rootPositions: "POSIÇÕES DA FUNDAMENTAL DESTACADAS",
    targetPositions: "{targets} POSIÇÕES DO INTERVALO · {pairs} DIGITAÇÕES",
    fretboardAria:
      "Braço de baixo de {count} cordas, casas de zero a doze. As notas verdes são {root}",
    fretboardTargetAria: "; as notas laranja são {target}.",
    progress: "Seu progresso",
    reset: "Zerar",
    progressHelper: "Um pouco melhor a cada questão.",
    accuracy: "PRECISÃO",
    correctLabel: "ACERTOS",
    streak: "SEQUÊNCIA ATUAL",
    answerTime: "TEMPO MÉDIO",
    statsEmpty: "Sua primeira nota é o começo de algo bom.",
    statsStreak:
      "{streak} acertos seguidos. Você está pegando o ritmo! Melhor sequência: {best}.",
    statsPractice: "Cada resposta é um treino. Melhor sequência: {best}.",
    resetConfirm:
      "Zerar todas as estatísticas? Os intervalos selecionados e as configurações do baixo serão mantidos.",
    footer: "Um pouco de prática, um ouvido melhor.",
    loveMusic: "Feito pelo amor à música",
    tritone: "trítono",
    intervalNames: {
      m2: "segunda menor",
      M2: "segunda maior",
      m3: "terça menor",
      M3: "terça maior",
      P4: "quarta justa",
      TT: "quarta aumentada / quinta diminuta",
      P5: "quinta justa",
      m6: "sexta menor",
      M6: "sexta maior",
      m7: "sétima menor",
      M7: "sétima maior",
    },
  },
};

function createI18n(getLanguage, $) {
  function t(key, values = {}) {
    let text = TRANSLATIONS[getLanguage()][key];

    // Portuguese has a different plural stem for semitom/semitons.
    if (key === "semitonesUp" && getLanguage() === "pt-BR" && values.count !== 1)
      text = "{count} semitons acima";

    return text.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
  }

  function intervalName(interval) {
    return TRANSLATIONS[getLanguage()].intervalNames[interval.id];
  }

  function renderLanguage() {
    document.documentElement.lang = getLanguage();
    document.title = t("title");

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAria));
    });

    document.querySelectorAll("[data-language]").forEach((button) => {
      const active = button.dataset.language === getLanguage();
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

  }

  return { t, intervalName, renderLanguage };
}
