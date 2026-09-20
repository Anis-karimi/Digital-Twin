/**
 * @file types.js
 * @description Type definitions and schemas for API requests, responses, and domain entities.
 */

/**
 * ============================================================================
 * EXISTING BACKEND TYPES
 * ============================================================================
 */

/**
 * @typedef {Object} AdminSettings
 * @property {string} [default_model]
 * @property {string[]} [available_models]
 * @property {Object} [raw]
 */

/**
 * @typedef {Object} AskAIRequest
 * @property {string} query User message text
 * @property {string} [contexts=""] Comma-separated list of document names or context IDs
 * @property {string} [language="fa"] Target response language ('fa' or 'en')
 * @property {string} [llmModel="gemma4"] Target LLM model
 * @property {string} [courseName=""] Associated course name
 * @property {string} [teacherName="Teacher"] Teacher name
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string|number} id
 * @property {string} text
 * @property {'me'|'other'} sender
 * @property {'like'|'dislike'|null} [feedback]
 * @property {string} time
 * @property {string} date
 */

/**
 * @typedef {Object} GeneratePdfRequest
 * @property {Array<{role: 'user'|'assistant', content: string}>} messages
 */

/**
 * @typedef {Object} UserFilesResponse
 * @property {string|null} photo_url
 * @property {string|null} audio_url
 * @property {Object} [raw]
 */

/**
 * @typedef {Object} QuizQuestion
 * @property {string} question Question title or prompt
 * @property {string[]} options Available choices
 * @property {string|number} answer Correct answer text or 0-indexed integer
 * @property {string} [explanation] Explanation for the answer
 */

/**
 * @typedef {Object} GenerateQuizRequest
 * @property {string} topic Subject or topic for the quiz
 * @property {number|string} count Number of questions to generate
 * @property {'easy'|'normal'|'hard'} [difficulty="normal"] Difficulty level
 * @property {string} [contexts=""] Document references for quiz generation
 * @property {string} [language="en"] Quiz language
 * @property {string} [llmModel="gemma4"] LLM model
 */

/**
 * @typedef {Object} ExplainAnswerRequest
 * @property {string} question The question to analyze
 */

/**
 * ============================================================================
 * NEW BACKEND / DOMAIN CONTRACT TYPES
 * ============================================================================
 */

/**
 * @typedef {Object} Course
 * @property {string} id Unique course identifier (e.g. 'os')
 * @property {string} title Course title in Persian
 * @property {string} titleEn Course title in English
 * @property {string} [description] Detailed course description
 * @property {string} [degree] Academic program / degree
 * @property {'private'|'public'} [privacy='private'] Course privacy level
 * @property {string|null} [photo_url] Course cover image URL
 * @property {string} [startDate] Start date string (YYYY-MM-DD)
 * @property {string} [endDate] End date string (YYYY-MM-DD)
 * @property {string} [preview] Last chat preview snippet
 * @property {string} [date] Last message timestamp (ISO 8601)
 * @property {number} [unreadCount] Number of unread messages
 */

/**
 * @typedef {Object} Student
 * @property {string} id Unique student identifier
 * @property {string} lessonId Associated course ID
 * @property {string} title Student full name
 * @property {string|null} photo_url Profile avatar URL
 * @property {'online'|'offline'|string} status Online status key
 * @property {string} statusFa Online status in Persian
 * @property {string} statusEn Online status in English
 * @property {string} [preview] Last chat preview
 * @property {string} [date] Timestamp of last interaction
 * @property {number} [unreadCount] Unread message count
 * @property {boolean} blocked Whether student is blocked from the course
 */

/**
 * @typedef {Object} JoinRequest
 * @property {number|string} id Request ID
 * @property {string} name Student name
 * @property {string} subject Course title
 * @property {string} [avatarClassName] Tailwind background color class
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id User ID
 * @property {string} name Full name
 * @property {string} [nameEn] Full name in English
 * @property {'teacher'|'student'|'admin'} role User role
 * @property {string} email Email address
 * @property {string|null} avatar Profile image URL
 */

/**
 * @typedef {Object} QuizSubmission
 * @property {string} quizId
 * @property {Record<number, string|number>} answers Map of questionIndex to selected answer
 */

/**
 * @typedef {Object} QuizResult
 * @property {boolean} success
 * @property {string} quizId
 * @property {number} score Total score achieved
 * @property {number} total Total points possible
 * @property {string} submittedAt ISO 8601 timestamp
 */

export {};
