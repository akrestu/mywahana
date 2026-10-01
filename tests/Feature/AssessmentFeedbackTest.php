<?php

use App\Models\AssessmentFeedback;
use App\Models\AssessmentSession;
use App\Models\User;

function completedSafetySession(User $user): AssessmentSession
{
    return AssessmentSession::create([
        'user_id' => $user->id, 'departemen' => 'Production', 'tags' => 'S',
        'status' => 'completed', 'total_questions' => 10, 'score' => 9,
        'percentage' => 90, 'passed' => true,
        'started_at' => now()->subMinutes(10), 'completed_at' => now(),
    ]);
}

function hseTrainer(string $site = 'BAU', string $name = 'Budi'): User
{
    return User::factory()->create(['departemen' => 'HSE', 'site' => $site, 'name' => $name]);
}

function feedbackPayload(array $overrides = []): array
{
    return array_merge([
        'trainer_user_id' => array_key_exists('trainer_user_id', $overrides) ? null : hseTrainer()->id,
        'trainer_scores' => array_fill(0, count(AssessmentFeedback::TRAINER_ASPECTS), 4),
        'effectiveness_scores' => array_fill(0, count(AssessmentFeedback::EFFECTIVENESS_STATEMENTS), 5),
        'komentar' => 'Mantap',
    ], $overrides);
}

test('result page redirects to the feedback sheet until it is filled', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);

    $this->actingAs($user)
        ->get(route('assessment.result', $session))
        ->assertRedirect(route('assessment.feedback', $session));

    $this->actingAs($user)
        ->get(route('assessment.feedback', $session))
        ->assertOk();
});

test('submitting the feedback stores averages and unlocks the result', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);

    $this->actingAs($user)
        ->post(route('assessment.feedback.store', $session), feedbackPayload())
        ->assertRedirect(route('assessment.result', $session));

    $feedback = AssessmentFeedback::firstWhere('assessment_session_id', $session->id);
    expect($feedback->trainer_avg)->toBe(4.0)
        ->and($feedback->effectiveness_avg)->toBe(5.0)
        ->and($feedback->trainer_name)->toBe('Budi')
        ->and($feedback->trainer_user_id)->not->toBeNull();

    $this->actingAs($user)->get(route('assessment.result', $session))->assertOk();
    $this->actingAs($user)
        ->get(route('assessment.feedback', $session))
        ->assertRedirect(route('assessment.result', $session));
});

test('feedback requires every item to be scored', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);

    $scores = array_fill(0, count(AssessmentFeedback::TRAINER_ASPECTS), 4);
    $scores[3] = null;

    $this->actingAs($user)
        ->post(route('assessment.feedback.store', $session), feedbackPayload(['trainer_scores' => $scores]))
        ->assertSessionHasErrors('trainer_scores.3');

    expect(AssessmentFeedback::count())->toBe(0);
});

test('users cannot fill feedback for another user session', function () {
    $owner = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($owner);

    $this->actingAs(User::factory()->create())
        ->post(route('assessment.feedback.store', $session), feedbackPayload())
        ->assertForbidden();
});

test('admin can view the feedback recap and export it', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);
    $this->actingAs($user)->post(route('assessment.feedback.store', $session), feedbackPayload());

    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)
        ->get(route('admin.assessment.feedback'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/assessment-feedback')
            ->where('summary.total', 1)
            ->where('trainer_stats.0.trainer_name', 'Budi'));

    $this->actingAs($admin)
        ->get(route('admin.assessment.feedback.export'))
        ->assertOk();
});

test('trainer options only list HSE employees from the participant site', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);
    $sameSite = hseTrainer('BAU', 'Andi');
    hseTrainer('MAS', 'Citra');
    User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);

    $this->actingAs($user)
        ->get(route('assessment.feedback', $session))
        ->assertInertia(fn ($page) => $page
            ->has('trainer_options', 1)
            ->where('trainer_options.0.id', $sameSite->id));
});

test('trainer from another site or department is rejected', function () {
    $user = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);
    $session = completedSafetySession($user);
    $otherSite = hseTrainer('MAS');
    $nonHse = User::factory()->create(['departemen' => 'Production', 'site' => 'BAU']);

    foreach ([$otherSite, $nonHse] as $trainer) {
        $this->actingAs($user)
            ->post(route('assessment.feedback.store', $session), feedbackPayload(['trainer_user_id' => $trainer->id]))
            ->assertSessionHasErrors('trainer_user_id');
    }

    expect(AssessmentFeedback::count())->toBe(0);
});
