import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Full Game Flow E2E Test
 *
 * Simulates a complete game session with:
 * - Teacher: Creates game, starts it, advances through questions
 * - Student: Joins game, answers questions
 */

test.describe('Full Game Flow - Teacher & Student', () => {
  let teacherPage: Page;
  let studentPage: Page;
  let teacherContext: BrowserContext;
  let studentContext: BrowserContext;
  let gameCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for teacher and student
    teacherContext = await browser.newContext();
    studentContext = await browser.newContext();
    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();
  });

  test.afterAll(async () => {
    await teacherContext.close();
    await studentContext.close();
  });

  test('Complete game flow from creation to completion', async () => {
    // ========================================
    // STEP 1: Teacher creates a TEST game (bypasses AI rate limits)
    // ========================================
    console.log('\n📚 TEACHER: Creating test game via API...');

    // Navigate to home page and use browser console to create test game
    await teacherPage.goto('/');
    await expect(teacherPage.locator('h1')).toContainText('LessonPlay');

    // Create test game via Convex mutation
    const convexUrl = 'https://dusty-sturgeon-934.convex.cloud';

    const result = await teacherPage.evaluate(async (url) => {
      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Call the test game creation mutation
      const response = await fetch(`${url}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'games:createTestGame',
          args: {},
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create test game: ${response.status} - ${text}`);
      }

      const data = await response.json();
      return data;
    }, convexUrl);

    if (result?.value?.code) {
      gameCode = result.value.code;
      console.log(`📚 TEACHER: Test game created with code: ${gameCode}`);
    } else {
      // Fallback: try the UI flow with Classic Quiz mode
      console.log('📚 TEACHER: API creation failed, trying UI flow...');

      // Select Classic Quiz mode
      const legacyModeButton = teacherPage.locator('button:has-text("Classic Quiz")');
      if (await legacyModeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await legacyModeButton.click();
      }

      // Enter lesson content
      const contentTextarea = teacherPage.locator('textarea[placeholder*="Paste your lesson content"]');
      await contentTextarea.waitFor({ state: 'visible', timeout: 10000 });
      await contentTextarea.fill(`
        The water cycle describes the movement of water on Earth.
        Evaporation turns water to vapor. Condensation forms clouds.
        Precipitation falls as rain or snow. Collection gathers water in lakes and oceans.
        The sun drives this cycle. 97% of water is in oceans.
      `);

      // Enter objective
      const objectiveInput = teacherPage.locator('input[placeholder*="Understand the causes"]');
      await objectiveInput.fill('Understand the water cycle');

      // Generate
      const generateButton = teacherPage.locator('button:has-text("Generate Quiz")');
      await generateButton.click();

      // Wait for navigation
      await teacherPage.waitForURL(/\/host\/[A-Z0-9]+/, { timeout: 120000 });
      const hostUrl = teacherPage.url();
      gameCode = hostUrl.split('/host/')[1];
    }

    // Navigate to host page
    console.log(`📚 TEACHER: Navigating to host page /host/${gameCode}`);
    await teacherPage.goto(`/host/${gameCode}`);

    // Verify lobby state
    await expect(teacherPage.getByRole('heading', { name: /Players/ })).toBeVisible({ timeout: 15000 });
    console.log('📚 TEACHER: In lobby, waiting for players...');

    // ========================================
    // STEP 2: Student joins the game
    // ========================================
    console.log('\n🎓 STUDENT: Navigating to join page...');
    await studentPage.goto('/play');

    // Enter game code
    console.log(`🎓 STUDENT: Entering game code: ${gameCode}`);
    const codeInput = studentPage.locator('input[placeholder="XXXXXX"]');
    await codeInput.waitFor({ state: 'visible', timeout: 10000 });
    await codeInput.fill(gameCode);

    // Wait for game to be found
    await expect(studentPage.locator('text=Game found!')).toBeVisible({ timeout: 10000 });
    console.log('🎓 STUDENT: Game found!');

    // Enter student name
    console.log('🎓 STUDENT: Entering name...');
    const nameInput = studentPage.locator('input[placeholder="Enter your name"]');
    await nameInput.fill('TestStudent');

    // Join the game
    const joinButton = studentPage.locator('button:has-text("Join Game")');
    await expect(joinButton).toBeEnabled({ timeout: 5000 });
    await joinButton.click();

    // Wait for student to be in the game
    console.log('🎓 STUDENT: Waiting to join game...');
    await studentPage.waitForURL(/\/play\/[A-Z0-9]+/, { timeout: 30000 });
    console.log('🎓 STUDENT: Successfully joined the game!');

    // Verify student sees waiting screen
    await expect(studentPage.getByText('Waiting for host to start')).toBeVisible({ timeout: 10000 });

    // ========================================
    // STEP 3: Verify teacher sees the student
    // ========================================
    console.log('\n📚 TEACHER: Verifying student joined...');
    await expect(teacherPage.locator('text=TestStudent')).toBeVisible({ timeout: 15000 });
    console.log('📚 TEACHER: Student "TestStudent" is visible in lobby!');

    // ========================================
    // STEP 4: Teacher starts the game
    // ========================================
    console.log('\n📚 TEACHER: Starting the game...');
    const startButton = teacherPage.locator('button:has-text("Start Game")');
    await expect(startButton).toBeEnabled({ timeout: 5000 });
    await startButton.click();

    // Handle countdown phase for engine games - wait and click "Start First Question"
    console.log('📚 TEACHER: Checking for countdown phase...');
    await teacherPage.waitForTimeout(2000); // Wait for state transition

    const startFirstQuestion = teacherPage.locator('button:has-text("Start First Question")');
    await startFirstQuestion.waitFor({ state: 'visible', timeout: 15000 });
    console.log('📚 TEACHER: In countdown phase, starting first question...');
    await startFirstQuestion.click();

    // Wait for question to appear on teacher screen
    console.log('📚 TEACHER: Waiting for question to appear...');
    await expect(teacherPage.getByText('Question', { exact: true })).toBeVisible({ timeout: 30000 });
    console.log('📚 TEACHER: Question is now displayed!');

    // ========================================
    // STEP 5: Student answers questions
    // ========================================
    console.log('\n🎓 STUDENT: Waiting for question modal...');
    await studentPage.waitForTimeout(3000);

    // Engine mode: Look for answer buttons in the modal (format: "A. option text")
    // The modal contains buttons like <button>A. Evaporation</button>
    const answerModal = studentPage.locator('button:has-text("A.")');
    let answered = false;

    if (await answerModal.isVisible({ timeout: 10000 }).catch(() => false)) {
      console.log('🎓 STUDENT: Found answer modal, clicking first option...');
      await answerModal.click();
      answered = true;

      // Wait for "Answer submitted" confirmation
      await expect(studentPage.getByText('Answer submitted')).toBeVisible({ timeout: 10000 });
      console.log('🎓 STUDENT: Answer submitted!');
    } else {
      // Fallback: try any button with answer-like text
      const allButtons = studentPage.locator('button');
      const buttonCount = await allButtons.count();
      for (let i = 0; i < buttonCount; i++) {
        const btn = allButtons.nth(i);
        const text = await btn.textContent();
        if (text && (text.includes('Evaporation') || text.includes('97%') || text.includes('Sun'))) {
          console.log(`🎓 STUDENT: Clicking answer: ${text.substring(0, 30)}`);
          await btn.click();
          answered = true;
          break;
        }
      }
    }

    if (!answered) {
      console.log('🎓 STUDENT: Could not find answer button, continuing...');
    }

    // ========================================
    // STEP 6: Teacher shows results
    // ========================================
    console.log('\n📚 TEACHER: Showing results...');
    await teacherPage.waitForTimeout(2000);

    const showResultsButton = teacherPage.locator('button:has-text("Show Results")');
    await expect(showResultsButton).toBeVisible({ timeout: 10000 });
    await showResultsButton.click();

    console.log('📚 TEACHER: Verifying results display...');
    await expect(teacherPage.getByRole('heading', { name: /Answer Distribution/ })).toBeVisible({ timeout: 15000 });
    console.log('📚 TEACHER: Results are displayed!');

    // ========================================
    // STEP 7: Continue through remaining questions
    // ========================================
    console.log('\n📚 TEACHER: Processing remaining questions...');

    let questionCount = 1;
    const maxQuestions = 5;

    while (questionCount < maxQuestions) {
      const nextQuestionButton = teacherPage.locator('button:has-text("Next Question")');
      const endGameButton = teacherPage.locator('button:has-text("End Game")');

      if (await endGameButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('📚 TEACHER: Last question, ending game...');
        await endGameButton.click();
        break;
      }

      if (await nextQuestionButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`📚 TEACHER: Moving to question ${questionCount + 1}...`);
        await nextQuestionButton.click();
        await teacherPage.waitForTimeout(3000);

        // Student answers (engine mode: look for A. button in modal)
        console.log(`🎓 STUDENT: Answering question ${questionCount + 1}...`);
        const nextAnswerButton = studentPage.locator('button:has-text("A.")');
        if (await nextAnswerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nextAnswerButton.click();
          await studentPage.waitForTimeout(1000);
        }

        await teacherPage.waitForTimeout(2000);

        // Show results
        const nextShowResults = teacherPage.locator('button:has-text("Show Results")');
        if (await nextShowResults.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nextShowResults.click();
          await teacherPage.waitForTimeout(1000);
        }

        questionCount++;
      } else {
        break;
      }
    }

    // ========================================
    // STEP 8: Verify game completion
    // ========================================
    console.log('\n📚 TEACHER: Verifying game completion...');
    await expect(teacherPage.getByText('Game Complete!')).toBeVisible({ timeout: 30000 });
    console.log('📚 TEACHER: Game completed successfully!');

    // Verify student in leaderboard
    await expect(teacherPage.locator('text=TestStudent')).toBeVisible({ timeout: 10000 });
    console.log('📚 TEACHER: Student "TestStudent" in final leaderboard!');

    // ========================================
    // STEP 9: Student sees final results
    // ========================================
    console.log('\n🎓 STUDENT: Checking final results...');
    await expect(studentPage.locator('text=/complete|Complete|finished|Final|Score/i')).toBeVisible({ timeout: 15000 });
    console.log('🎓 STUDENT: Can see final game results!');

    console.log('\n✅ FULL GAME FLOW TEST COMPLETED SUCCESSFULLY!');
  });
});

test.describe('Edge Cases', () => {
  test('Invalid game code shows error', async ({ page }) => {
    console.log('\n🔴 Testing invalid game code...');
    await page.goto('/play');

    const codeInput = page.locator('input[placeholder="XXXXXX"]');
    await codeInput.waitFor({ state: 'visible', timeout: 10000 });
    await codeInput.fill('ZZZZZ1');

    await expect(page.locator('text=Game not found')).toBeVisible({ timeout: 10000 });
    console.log('✅ Invalid code shows "Game not found" error!');
  });

  test('Home page loads correctly', async ({ page }) => {
    console.log('\n🏠 Testing home page...');
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('LessonPlay');
    await expect(page.locator('textarea').first()).toBeVisible();
    console.log('✅ Home page loads correctly!');
  });

  test('Cannot join without name', async ({ page }) => {
    console.log('\n🔴 Testing join without name...');
    await page.goto('/play');

    const codeInput = page.locator('input[placeholder="XXXXXX"]');
    await codeInput.fill('ABC123');

    const joinButton = page.locator('button:has-text("Join Game")');
    await expect(joinButton).toBeDisabled();
    console.log('✅ Join button disabled without name!');
  });
});
