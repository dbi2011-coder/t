// واجهة الطالب والاختبارات مع Supabase

let currentQuestionIndex = 0;
let studentAnswers = [];
let startTime;
let timerInterval;
let questions = [];
let settings = {};

// دالة لعرض التنبيهات في واجهة الطالب
function showAlert(message, type = 'info') {
    // إزالة أي تنبيهات سابقة
    const existingAlert = document.querySelector('.student-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `student-alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        border: none;
        animation: slideIn 0.3s ease-out;
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alertDiv.style.backgroundColor = colors[type] || colors.info;
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // إضافة أنيميشن
    if (!document.querySelector('#student-alert-animations')) {
        const style = document.createElement('style');
        style.id = 'student-alert-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 300);
        }
    }, 4000);
}

async function initStudent() {
    console.log('🎓 بدء تهيئة واجهة الطالب...');
    await loadSettings();
    showLoginInterface();
}

async function loadSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*')
            .single();
        
        if (error) throw error;
        settings = data;
        
    } catch (error) {
        console.error('Error loading settings from Supabase:', error);
        settings = JSON.parse(localStorage.getItem('settings')) || {
            questionsCount: 10,
            loginType: 'open',
            attemptsCount: 1,
            resultsDisplay: 'show-answers'
        };
    }
    
    showLoginInterface();
}

function showLoginInterface() {
    document.getElementById('open-login').style.display = settings.loginType === 'open' ? 'block' : 'none';
    document.getElementById('restricted-login').style.display = settings.loginType === 'restricted' ? 'block' : 'none';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'none';
    
    console.log('🔐 عرض واجهة الدخول');
}

async function validateRestrictedLogin() {
    const studentId = document.getElementById('student-id-input').value.trim();
    const studentName = document.getElementById('student-name-input').value.trim();
    
    if (!studentId || !studentName) {
        showAlert('يرجى إدخال جميع البيانات', 'error');
        return;
    }
    
    let authorizedStudents = [];
    
    try {
        const { data, error } = await supabaseClient
            .from('authorized_students')
            .select('*');
        
        if (error) throw error;
        authorizedStudents = data || [];
        
    } catch (error) {
        console.error('Error loading authorized students from Supabase:', error);
        authorizedStudents = JSON.parse(localStorage.getItem('authorizedStudents')) || [];
    }
    
    const student = authorizedStudents.find(s => s.id === studentId && s.name === studentName);
    
    if (!student) {
        showAlert('رقم الهوية/الإقامة أو اسم الطالب غير صحيح', 'error');
        return;
    }
    
    if (student.used_attempts >= settings.attemptsCount) {
        showAlert('لقد استنفذت عدد المحاولات المسموحة', 'error');
        return;
    }
    
    // تحديث عدد المحاولات المستخدمة
    student.used_attempts = (student.used_attempts || 0) + 1;
    
    try {
        const { error } = await supabaseClient
            .from('authorized_students')
            .update({ used_attempts: student.used_attempts })
            .eq('id', studentId);
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error updating attempts in Supabase:', error);
        localStorage.setItem('authorizedStudents', JSON.stringify(authorizedStudents));
    }
    
    startTest(studentName);
}

function startTest(studentName) {
    console.log('🎯 بدء اختبار للطالب:', studentName);
    
    document.getElementById('open-login').style.display = 'none';
    document.getElementById('restricted-login').style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    
    // تحميل الأسئلة وعرضها
    loadQuestionsForTest();
    
    // التحقق من وجود أسئلة قبل البدء
    if (questions.length === 0) {
        showAlert('لا توجد أسئلة متاحة للاختبار', 'error');
        showLoginInterface();
        return;
    }
    
    displayCurrentQuestion();
    
    // بدء المؤقت
    startTime = new Date();
    startTimer();
    
    // حفظ اسم الطالب
    localStorage.setItem('currentStudent', studentName);
    
    console.log('⏱️ بدء المؤقت والاختبار');
    showAlert('تم بدء الاختبار بنجاح!', 'success');
}

async function loadQuestionsForTest() {
    let allQuestions = [];
    
    console.log('🔄 جاري تحميل الأسئلة للاختبار...');
    
    try {
        // محاولة تحميل الأسئلة من Supabase أولاً
        const { data, error } = await supabaseClient
            .from('questions')
            .select('*');
        
        if (error) {
            console.error('❌ خطأ في تحميل الأسئلة من Supabase:', error);
            throw error;
        }
        
        allQuestions = data || [];
        console.log(`✅ تم تحميل ${allQuestions.length} سؤال من Supabase`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الأسئلة من Supabase:', error);
        
        // تحميل من localStorage كنسخة احتياطية
        allQuestions = JSON.parse(localStorage.getItem('questions')) || [];
        console.log(`💾 تم تحميل ${allQuestions.length} سؤال من localStorage`);
    }
    
    if (allQuestions.length === 0) {
        showAlert('لا توجد أسئلة متاحة للاختبار', 'error');
        showLoginInterface();
        return;
    }
    
    console.log('📝 جاري معالجة الأسئلة...');
    
    const flattenedQuestions = [];
    allQuestions.forEach(question => {
        if (question.type === 'reading-comprehension' && question.passage_questions) {
            // إضافة كل سؤال من أسئلة القطعة كسؤال منفصل
            question.passage_questions.forEach(passageQ => {
                flattenedQuestions.push({
                    id: passageQ.id,
                    text: passageQ.text,
                    type: 'reading-comprehension-item',
                    options: passageQ.options,
                    correctAnswer: passageQ.correctAnswer,
                    readingPassage: question.reading_passage,
                    parentQuestionId: question.id
                });
            });
        } else {
            flattenedQuestions.push(question);
        }
    });
    
    const questionsCount = Math.min(settings.questionsCount, flattenedQuestions.length);
    questions = getRandomQuestions(flattenedQuestions, questionsCount);
    
    console.log(`🎯 تم اختيار ${questions.length} سؤال للاختبار`);
    
    studentAnswers = new Array(questions.length).fill(null);
}

function getRandomQuestions(allQuestions, count) {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function displayCurrentQuestion() {
    const container = document.getElementById('questions-container');
    
    if (questions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                <h3>لا توجد أسئلة متاحة</h3>
                <p>يرجى الرجوع وإعادة المحاولة</p>
            </div>
        `;
        return;
    }
    
    const question = questions[currentQuestionIndex];
    container.innerHTML = '';
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-container';
    questionDiv.style.border = '1px solid #ddd';
    questionDiv.style.borderRadius = '8px';
    questionDiv.style.padding = '20px';
    questionDiv.style.marginBottom = '20px';
    questionDiv.style.backgroundColor = 'white';
    questionDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    
    let questionHTML = `
        <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            السؤال ${currentQuestionIndex + 1} من ${questions.length}
        </h3>
    `;
    
    if (question.type === 'reading-comprehension-item' && question.readingPassage) {
        questionHTML += `
            <div class="reading-passage" style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-right: 4px solid #3498db;">
                <h4 style="color: #2c3e50; margin-bottom: 10px;">📖 اقرأ القطعة التالية ثم أجب عن السؤال:</h4>
                <div class="passage-content" style="line-height: 1.8; font-size: 16px; color: #555;">
                    ${question.readingPassage}
                </div>
            </div>
        `;
    }
    
    questionHTML += `
        <p class="question-text" style="font-size: 18px; color: #2c3e50; margin-bottom: 20px; font-weight: bold;">
            ${question.text}
        </p>
    `;
    
    if (question.type === 'multiple-with-media' && question.media_url) {
        questionHTML += `
            <div class="media-attachment" style="margin: 15px 0; text-align: center;">
                ${isYouTubeUrl(question.media_url) ? 
                    `<iframe src="${getYouTubeEmbedUrl(question.media_url)}" frameborder="0" allowfullscreen style="border-radius: 8px; width: 100%; height: 315px;"></iframe>` :
                    `<img src="${question.media_url}" alt="مرفق السؤال" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`
                }
            </div>
        `;
    }
    
    questionHTML += `
        <div class="options-container" style="margin-top: 20px;">
            ${question.options.map((option, index) => `
                <div class="option-item" style="display: flex; align-items: center; margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; border: 2px solid #e9ecef; transition: all 0.3s;">
                    <input type="radio" name="answer" id="option-${index}" value="${index + 1}" 
                           ${studentAnswers[currentQuestionIndex] === index + 1 ? 'checked' : ''}
                           style="margin-left: 10px; transform: scale(1.2);">
                    <label for="option-${index}" style="font-size: 16px; color: #495057; cursor: pointer; flex: 1;">
                        ${option}
                    </label>
                </div>
            `).join('')}
        </div>
    `;
    
    questionDiv.innerHTML = questionHTML;
    container.appendChild(questionDiv);
    
    // إضافة أزرار التنقل
    const navigationDiv = document.createElement('div');
    navigationDiv.className = 'navigation-buttons';
    navigationDiv.style.display = 'flex';
    navigationDiv.style.justifyContent = 'space-between';
    navigationDiv.style.marginTop = '25px';
    navigationDiv.style.paddingTop = '20px';
    navigationDiv.style.borderTop = '2px solid #eee';
    
    navigationDiv.innerHTML = `
        <button class="btn-secondary" onclick="previousQuestion()" 
                ${currentQuestionIndex === 0 ? 'disabled' : ''}
                style="padding: 12px 25px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; ${currentQuestionIndex === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
            ← السابق
        </button>
        <button class="btn-primary" onclick="nextQuestion()" 
                style="padding: 12px 25px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
            ${currentQuestionIndex === questions.length - 1 ? 'إنهاء الاختبار' : 'التالي →'}
        </button>
    `;
    
    container.appendChild(navigationDiv);
    
    // إضافة مستمعي الأحداث للخيارات
    question.options.forEach((_, index) => {
        const radioInput = document.getElementById(`option-${index}`);
        if (radioInput) {
            radioInput.addEventListener('change', function() {
                studentAnswers[currentQuestionIndex] = parseInt(this.value);
                console.log(`✅ تم اختيار الإجابة: ${this.value} للسؤال ${currentQuestionIndex + 1}`);
            });
        }
    });
    
    console.log(`📝 عرض السؤال ${currentQuestionIndex + 1} من ${questions.length}`);
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
        console.log(`⬅️ الانتقال إلى السؤال ${currentQuestionIndex + 1}`);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
        console.log(`➡️ الانتقال إلى السؤال ${currentQuestionIndex + 1}`);
    } else {
        submitTest();
    }
}

function startTimer() {
    console.log('⏱️ بدء المؤقت...');
    clearInterval(timerInterval);
    
    // تحديث المؤقت فوراً
    updateTimer();
    
    // ثم تحديثه كل ثانية
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!startTime) {
        console.log('❌ startTime غير معروف');
        return;
    }
    
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = elapsedTime % 60;
    
    const timerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = timerText;
        timerElement.style.fontSize = '20px';
        timerElement.style.fontWeight = 'bold';
        timerElement.style.color = '#e74c3c';
        timerElement.style.padding = '15px';
        timerElement.style.background = '#f8f9fa';
        timerElement.style.borderRadius = '8px';
        timerElement.style.border = '2px solid #e74c3c';
        timerElement.style.textAlign = 'center';
    }
    
    // تحديث كل 30 ثانية في الconsole للتأكد من عمل المؤقت
    if (seconds % 30 === 0) {
        console.log(`⏰ المؤقت يعمل: ${timerText}`);
    }
}

async function submitTest() {
    console.log('🏁 إنهاء الاختبار...');
    clearInterval(timerInterval);
    
    const endTime = new Date();
    const timeTaken = document.getElementById('timer').textContent;
    
    // حساب النتيجة
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    console.log(`📊 النتيجة: ${score}/${questions.length} (${percentage}%)`);
    
    const studentName = localStorage.getItem('currentStudent');
    const studentResult = {
        name: studentName,
        score: score,
        total: questions.length,
        percentage: percentage,
        time_taken: timeTaken,
        date: new Date().toLocaleDateString('ar-SA'),
        created_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabaseClient
            .from('students')
            .insert([studentResult]);
        
        if (error) throw error;
        
        console.log('✅ تم حفظ نتيجة الطالب في Supabase');
        
    } catch (error) {
        console.error('❌ Error saving to Supabase, using localStorage:', error);
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.push(studentResult);
        localStorage.setItem('students', JSON.stringify(students));
        console.log('💾 تم حفظ النتيجة في localStorage');
    }
    
    showResults(score, percentage, timeTaken);
    showAlert('تم إنهاء الاختبار بنجاح!', 'success');
}

function calculateScore() {
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
        if (studentAnswers[i] === questions[i].correctAnswer) {
            score++;
        }
    }
    
    return score;
}

function showResults(score, percentage, timeTaken) {
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';
    
    const container = document.getElementById('results-container');
    container.innerHTML = '';
    
    const resultsDiv = document.createElement('div');
    resultsDiv.className = 'results-summary';
    resultsDiv.style.textAlign = 'center';
    resultsDiv.style.padding = '40px';
    resultsDiv.style.background = 'white';
    resultsDiv.style.borderRadius = '12px';
    resultsDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    resultsDiv.style.margin = '20px 0';
    
    let resultsHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">🎉</div>
        <h2 style="color: #2c3e50; margin-bottom: 20px;">نتيجة الاختبار</h2>
        <div class="score" style="font-size: 48px; font-weight: bold; color: ${percentage >= 80 ? '#27ae60' : percentage >= 60 ? '#f39c12' : '#e74c3c'}; margin: 20px 0;">
            ${percentage}%
        </div>
        <p style="font-size: 18px; color: #7f8c8d; margin: 10px 0;">
            <strong>الإجابات الصحيحة:</strong> ${score} من ${questions.length}
        </p>
        <p style="font-size: 18px; color: #7f8c8d; margin: 10px 0;">
            <strong>الوقت المستغرق:</strong> ${timeTaken}
        </p>
    `;
    
    if (settings.resultsDisplay === 'show-answers') {
        resultsHTML += `
            <div class="questions-review" style="margin-top: 40px; text-align: right;">
                <h3 style="color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">مراجعة الأسئلة</h3>
                ${questions.map((question, index) => {
                    const studentAnswer = studentAnswers[index];
                    const isCorrect = studentAnswer === question.correctAnswer;
                    
                    return `
                        <div class="question-feedback ${isCorrect ? 'correct' : 'incorrect'}" 
                             style="margin: 20px 0; padding: 20px; background: ${isCorrect ? '#d5f4e6' : '#fadbd8'}; border-radius: 8px; border-right: 4px solid ${isCorrect ? '#27ae60' : '#e74c3c'};">
                            <h4 style="color: #2c3e50; margin-bottom: 15px;">السؤال ${index + 1}</h4>
                            ${question.readingPassage ? `
                                <div class="reading-passage" style="margin: 10px 0; padding: 15px; background: white; border-radius: 6px;">
                                    <strong>📖 قطعة الاستيعاب:</strong>
                                    <div class="passage-content" style="margin-top: 10px; line-height: 1.6; color: #555;">
                                        ${question.readingPassage}
                                    </div>
                                </div>
                            ` : ''}
                            <p style="font-size: 16px; color: #2c3e50; margin: 10px 0;"><strong>النص:</strong> ${question.text}</p>
                            <p style="font-size: 16px; color: #2c3e50; margin: 10px 0;"><strong>إجابتك:</strong> ${studentAnswer ? question.options[studentAnswer - 1] : 'لم تجب'}</p>
                            <p style="font-size: 16px; color: #2c3e50; margin: 10px 0;"><strong>الإجابة الصحيحة:</strong> ${question.options[question.correctAnswer - 1]}</p>
                            <p class="result ${isCorrect ? 'correct-text' : 'incorrect-text'}" 
                               style="font-size: 16px; font-weight: bold; margin: 10px 0; color: ${isCorrect ? '#27ae60' : '#e74c3c'};">
                                ${isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة خاطئة'}
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    resultsHTML += `
        <button class="btn-primary" onclick="location.reload()" 
                style="margin-top: 30px; padding: 15px 30px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 18px; font-weight: bold;">
            إعادة الاختبار
        </button>
    `;
    
    resultsDiv.innerHTML = resultsHTML;
    container.appendChild(resultsDiv);
}

function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

function getYouTubeEmbedUrl(url) {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
}

// جعل الدوال متاحة globally
window.validateRestrictedLogin = validateRestrictedLogin;
window.startTest = startTest;
window.previousQuestion = previousQuestion;
window.nextQuestion = nextQuestion;
window.submitTest = submitTest;
window.showAlert = showAlert;
