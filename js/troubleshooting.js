// بيانات وهمية لمشاكل البرمجيات وحلولها
const softwareIssues = {
    performance: [
        {
            id: 1,
            title: 'بطء شديد في النظام',
            questions: [
                {
                    text: 'هل تظهر أي رسائل خطأ عند البطء؟',
                    answers: [
                        { text: 'نعم', next: 2 },
                        { text: 'لا', next: 3 }
                    ]
                },
                {
                    id: 2,
                    text: 'ما هي الرسالة التي تظهر؟',
                    input: true,
                    next: 4
                },
                {
                    id: 3,
                    text: 'هل البطء يحدث في برامج معينة أم النظام ككل؟',
                    answers: [
                        { text: 'برامج معينة', next: 5 },
                        { text: 'النظام ككل', next: 6 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 4,
                    title: 'خطأ في برنامج معين',
                    steps: [
                        'حاول إعادة تثبيت البرنامج الذي يظهر الخطأ',
                        'تحقق من وجود تحديثات للبرنامج',
                        'ابحث عن رسالة الخطأ في الإنترنت مع ذكر اسم البرنامج'
                    ]
                },
                {
                    id: 5,
                    title: 'بطء في برامج معينة',
                    steps: [
                        'تحقق من متطلبات النظام للبرنامج',
                        'أغبق البرامج الأخرى غير الضرورية',
                        'حاول تخفيض إعدادات الأداء في البرنامج'
                    ]
                },
                {
                    id: 6,
                    title: 'بطء عام في النظام',
                    steps: [
                        'افتح مدير المهام وتحقق من استهلاك الموارد',
                        'قم بإجراء فحص لفيروسات',
                        'حاول إلغاء تثبيت البرامج غير الضرورية',
                        'افحص القرص الصلب عن طريق أداة "Check Disk"'
                    ]
                }
            ]
        }
    ],
    software: [
        {
            id: 7,
            title: 'برنامج لا يعمل أو يتعطل',
            questions: [
                {
                    text: 'هل البرنامج كان يعمل من قبل وتوقف الآن؟',
                    answers: [
                        { text: 'نعم', next: 8 },
                        { text: 'لا', next: 9 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 8,
                    title: 'برنامج كان يعمل وتوقف',
                    steps: [
                        'حاول إعادة تشغيل الحاسب',
                        'تحقق من وجود تحديثات للبرنامج',
                        'قم بإصلاح تثبيت البرنامج من لوحة التحكم'
                    ]
                },
                {
                    id: 9,
                    title: 'برنامج جديد لا يعمل',
                    steps: [
                        'تحقق من توافق البرنامج مع نظام التشغيل',
                        'تحقق من متطلبات النظام للبرنامج',
                        'حاول تشغيل البرنامج كمسؤول'
                    ]
                }
            ]
        }
    ],
    hardware: [
        {
            id: 10,
            title: 'ضوضاء أو حرارة عالية',
            questions: [
                {
                    text: 'هل الضوضاء تأتي من المعالج أم كرت الشاشة أم مكان آخر؟',
                    answers: [
                        { text: 'المعالج/المراوح', next: 11 },
                        { text: 'كرت الشاشة', next: 12 },
                        { text: 'مكان آخر', next: 13 }
                    ]
                }
            ],
            solutions: [
                {
                    id: 11,
                    title: 'مشكلة في مراوح المعالج',
                    steps: [
                        'افتح الحاسب وتحقق من أن المروحة مثبتة جيداً',
                        'نظف الغبار من المروحة والرديتر',
                        'تحقق من إعدادات المروحة في الـ BIOS'
                    ]
                },
                {
                    id: 12,
                    title: 'مشكلة في كرت الشاشة',
                    steps: [
                        'تحقق من أن مراوح كرت الشاشة تعمل',
                        'نظف الغبار من كرت الشاشة',
                        'تحقق من درجات الحرارة باستخدام برنامج مثل GPU-Z'
                    ]
                }
            ]
        }
    ]
};

// متغيرات لتتبع حالة استكشاف الأخطاء
let currentIssue = null;
let currentQuestion = null;
let userPath = [];

// بدء عملية استكشاف الخطأ
function startTroubleshooting(issueType) {
    currentIssue = issueType;
    userPath = [];
    
    // العثور على المشكلة الأولى من النوع المحدد
    const issue = softwareIssues[issueType][0];
    showQuestion(issue.questions[0]);
    
    document.querySelector('.troubleshooting-options').classList.add('hidden');
    document.getElementById('troubleshootingFlow').classList.remove('hidden');
}

// عرض السؤال الحالي
function showQuestion(question) {
    currentQuestion = question;
    const stepContainer = document.getElementById('currentStep');
    
    let questionHTML = `
        <div class="step-question">${question.text}</div>
        <div class="step-options">
    `;
    
    if (question.answers) {
        question.answers.forEach(answer => {
            questionHTML += `
                <div class="step-option" onclick="answerQuestion(${answer.next})">${answer.text}</div>
            `;
        });
    } else if (question.input) {
        questionHTML += `
            <input type="text" id="userInput" class="form-control" placeholder="أدخل رسالة الخطأ...">
            <button class="btn" onclick="submitInput(${question.next})">تأكيد</button>
        `;
    }
    
    questionHTML += `</div>`;
    stepContainer.innerHTML = questionHTML;
}

// معالجة إجابة المستخدم
function answerQuestion(nextStepId) {
    userPath.push({
        question: currentQuestion.text,
        answer: event.target.textContent
    });
    
    // البحث عن السؤال التالي
    const nextQuestion = findQuestionById(nextStepId);
    
    if (nextQuestion) {
        showQuestion(nextQuestion);
    } else {
        // إذا لم يكن هناك سؤال تالي، عرض الحلول
        showSolutions(nextStepId);
    }
}

// معالجة الإدخال النصي من المستخدم
function submitInput(nextStepId) {
    const userInput = document.getElementById('userInput').value;
    
    if (!userInput.trim()) {
        alert('الرجاء إدخال رسالة الخطأ');
        return;
    }
    
    userPath.push({
        question: currentQuestion.text,
        answer: userInput
    });
    
    showSolutions(nextStepId);
}

// البحث عن سؤال بواسطة المعرف
function findQuestionById(id) {
    for (const issueType in softwareIssues) {
        for (const issue of softwareIssues[issueType]) {
            for (const question of issue.questions) {
                if (question.id === id) {
                    return question;
                }
            }
        }
    }
    return null;
}

// عرض الحلول المناسبة
function showSolutions(solutionId) {
    let solutions = [];
    
    // البحث عن الحلول في جميع المشاكل
    for (const issueType in softwareIssues) {
        for (const issue of softwareIssues[issueType]) {
            if (issue.solutions) {
                for (const solution of issue.solutions) {
                    if (solution.id === solutionId) {
                        solutions.push(solution);
                    }
                }
            }
        }
    }
    
    if (solutions.length === 0) {
        solutions.push({
            title: 'لا يوجد حل محدد',
            steps: [
                'نعتذر، لا يوجد حل محدد لهذه المشكلة بناءً على إجاباتك',
                'يمكنك البحث في الإنترنت باستخدام كلمات رئيسية من مشكلتك',
                'يمكنك التواصل مع الدعم الفني لمزيد من المساعدة'
            ]
        });
    }
    
    // عرض الحلول
    const solutionsContainer = document.getElementById('solutionsList');
    solutionsContainer.innerHTML = '';
    
    solutions.forEach(solution => {
        const solutionElement = document.createElement('div');
        solutionElement.className = 'solution-item';
        
        let stepsHTML = '<ol>';
        solution.steps.forEach(step => {
            stepsHTML += `<li>${step}</li>`;
        });
        stepsHTML += '</ol>';
        
        solutionElement.innerHTML = `
            <h4>${solution.title}</h4>
            ${stepsHTML}
        `;
        
        solutionsContainer.appendChild(solutionElement);
    });
    
    // إظهار قسم الحلول وإخفاء سير العمل
    document.getElementById('troubleshootingFlow').classList.add('hidden');
    document.getElementById('solutions').classList.remove('hidden');
}

// إعادة تعيين عملية استكشاف الأخطاء
function resetTroubleshooting() {
    document.getElementById('troubleshootingFlow').classList.add('hidden');
    document.getElementById('solutions').classList.add('hidden');
    document.querySelector('.troubleshooting-options').classList.remove('hidden');
    
    currentIssue = null;
    currentQuestion = null;
    userPath = [];
}

// جمع تعليقات المستخدم على الحلول
function giveFeedback(feedback) {
    alert(`شكراً لك على تعليقك! تم تسجيل "${feedback === 'yes' ? 'مفيد' : 'غير مفيد'}"`);
    resetTroubleshooting();
}
// ... (previous JavaScript code remains the same)

// Display the current question (updated with icons)
function showQuestion(question) {
    currentQuestion = question;
    const stepContainer = document.getElementById('currentStep');
    
    let questionHTML = `
        <div class="step-question">
            <i class="fas fa-question-circle"></i> ${question.text}
        </div>
        <div class="step-options">
    `;
    
    if (question.answers) {
        question.answers.forEach(answer => {
            questionHTML += `
                <div class="step-option" onclick="answerQuestion(${answer.next})">
                    <i class="far fa-dot-circle"></i> ${answer.text}
                </div>
            `;
        });
    } else if (question.input) {
        questionHTML += `
            <div class="input-group">
                <input type="text" id="userInput" class="form-control" placeholder="Enter error message...">
                <button class="btn" onclick="submitInput(${question.next})">
                    <i class="fas fa-arrow-right"></i> Submit
                </button>
            </div>
        `;
    }
    
    questionHTML += `</div>`;
    stepContainer.innerHTML = questionHTML;
}

// Display recommended solutions (updated with icons)
function showSolutions(solutionId) {
    // ... (previous solution finding code remains the same)
    
    // Display solutions
    const solutionsContainer = document.getElementById('solutionsList');
    solutionsContainer.innerHTML = '';
    
    solutions.forEach(solution => {
        const solutionElement = document.createElement('div');
        solutionElement.className = 'solution-item';
        
        let stepsHTML = '<ol>';
        solution.steps.forEach(step => {
            stepsHTML += `<li><i class="fas fa-angle-right"></i> ${step}</li>`;
        });
        stepsHTML += '</ol>';
        
        solutionElement.innerHTML = `
            <h4><i class="fas fa-lightbulb"></i> ${solution.title}</h4>
            ${stepsHTML}
        `;
        
        solutionsContainer.appendChild(solutionElement);
    });
    
    // ... (rest of the function remains the same)
}

// ... (rest of the JavaScript remains the same)