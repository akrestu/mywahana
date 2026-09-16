<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['assessment_session_questions', 'hr_assessment_session_questions'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->text('question_snapshot')->nullable();
                foreach (range(1, 4) as $number) {
                    $table->text("jawaban_{$number}_snapshot")->nullable();
                }
                $table->unsignedTinyInteger('jawaban_benar_snapshot')->nullable();
            });
        }

        $this->backfill('assessment_session_questions', 'assessment_question_id', 'assessment_questions');
        $this->backfill('hr_assessment_session_questions', 'hr_assessment_question_id', 'hr_assessment_questions');

        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteSessionTables();

            return;
        }

        Schema::table('assessment_session_questions', function (Blueprint $table) {
            $table->dropForeign(['assessment_question_id']);
            $table->foreignId('assessment_question_id')->nullable()->change();
            $table->foreign('assessment_question_id')->references('id')->on('assessment_questions')->nullOnDelete();
        });
        Schema::table('hr_assessment_session_questions', function (Blueprint $table) {
            $table->dropForeign('hr_asq_question_fk');
            $table->unsignedBigInteger('hr_assessment_question_id')->nullable()->change();
            $table->foreign('hr_assessment_question_id', 'hr_asq_question_fk')
                ->references('id')->on('hr_assessment_questions')->nullOnDelete();
        });
    }

    private function backfill(string $sessionTable, string $questionId, string $questionTable): void
    {
        $lastId = 0;
        do {
            $rows = DB::table("{$sessionTable} as sq")
                ->join("{$questionTable} as q", "sq.{$questionId}", '=', 'q.id')
                ->where('sq.id', '>', $lastId)
                ->orderBy('sq.id')
                ->limit(500)
                ->get([
                    'sq.id', 'q.question', 'q.jawaban_1', 'q.jawaban_2',
                    'q.jawaban_3', 'q.jawaban_4', 'q.jawaban_benar',
                ]);

            foreach ($rows as $row) {
                DB::table($sessionTable)->where('id', $row->id)->update([
                    'question_snapshot' => $row->question,
                    'jawaban_1_snapshot' => $row->jawaban_1,
                    'jawaban_2_snapshot' => $row->jawaban_2,
                    'jawaban_3_snapshot' => $row->jawaban_3,
                    'jawaban_4_snapshot' => $row->jawaban_4,
                    'jawaban_benar_snapshot' => $row->jawaban_benar,
                ]);
                $lastId = $row->id;
            }
        } while ($rows->count() === 500);
    }

    private function rebuildSqliteSessionTables(): void
    {
        Schema::disableForeignKeyConstraints();
        try {
            $definitions = [
                'assessment_session_questions' => ['assessment_session_id', 'assessment_question_id'],
                'hr_assessment_session_questions' => ['hr_assessment_session_id', 'hr_assessment_question_id'],
            ];
            $columns = [
                'id', 'urutan', 'jawaban_user', 'is_correct', 'question_snapshot',
                'jawaban_1_snapshot', 'jawaban_2_snapshot', 'jawaban_3_snapshot',
                'jawaban_4_snapshot', 'jawaban_benar_snapshot', 'created_at', 'updated_at',
            ];

            foreach ($definitions as $tableName => [$sessionId, $questionId]) {
                $oldTable = "{$tableName}_before_snapshot";
                Schema::rename($tableName, $oldTable);
                Schema::create($tableName, function (Blueprint $table) use ($sessionId, $questionId) {
                    $table->id();
                    $table->foreignId($sessionId)->constrained()->cascadeOnDelete();
                    $table->foreignId($questionId)->nullable()->constrained()->nullOnDelete();
                    $table->unsignedSmallInteger('urutan');
                    $table->unsignedTinyInteger('jawaban_user')->nullable();
                    $table->boolean('is_correct')->nullable();
                    $table->text('question_snapshot')->nullable();
                    foreach (range(1, 4) as $number) {
                        $table->text("jawaban_{$number}_snapshot")->nullable();
                    }
                    $table->unsignedTinyInteger('jawaban_benar_snapshot')->nullable();
                    $table->timestamps();
                });

                $allColumns = ['id', $sessionId, $questionId, ...array_slice($columns, 1)];
                DB::table($tableName)->insertUsing($allColumns, DB::table($oldTable)->select($allColumns));
                Schema::drop($oldTable);
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildOriginalSqliteSessionTables();

            return;
        }

        DB::table('assessment_session_questions')->whereNull('assessment_question_id')->delete();
        DB::table('hr_assessment_session_questions')->whereNull('hr_assessment_question_id')->delete();

        Schema::table('assessment_session_questions', function (Blueprint $table) {
            $table->dropForeign(['assessment_question_id']);
            $table->foreignId('assessment_question_id')->nullable(false)->change();
            $table->foreign('assessment_question_id')->references('id')->on('assessment_questions')->cascadeOnDelete();
        });
        Schema::table('hr_assessment_session_questions', function (Blueprint $table) {
            $table->dropForeign('hr_asq_question_fk');
            $table->unsignedBigInteger('hr_assessment_question_id')->nullable(false)->change();
            $table->foreign('hr_assessment_question_id', 'hr_asq_question_fk')
                ->references('id')->on('hr_assessment_questions')->cascadeOnDelete();
        });
        foreach (['assessment_session_questions', 'hr_assessment_session_questions'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn([
                    'question_snapshot', 'jawaban_1_snapshot', 'jawaban_2_snapshot',
                    'jawaban_3_snapshot', 'jawaban_4_snapshot', 'jawaban_benar_snapshot',
                ]);
            });
        }
    }

    private function rebuildOriginalSqliteSessionTables(): void
    {
        Schema::disableForeignKeyConstraints();
        try {
            $definitions = [
                'assessment_session_questions' => ['assessment_session_id', 'assessment_question_id'],
                'hr_assessment_session_questions' => ['hr_assessment_session_id', 'hr_assessment_question_id'],
            ];
            $columns = [
                'id', 'urutan', 'jawaban_user', 'is_correct', 'created_at', 'updated_at',
            ];

            foreach ($definitions as $tableName => [$sessionId, $questionId]) {
                $oldTable = "{$tableName}_with_snapshot";
                Schema::rename($tableName, $oldTable);
                Schema::create($tableName, function (Blueprint $table) use ($tableName, $sessionId, $questionId) {
                    $table->id();

                    if ($tableName === 'hr_assessment_session_questions') {
                        $table->unsignedBigInteger($sessionId);
                        $table->unsignedBigInteger($questionId);
                        $table->foreign($sessionId, 'hr_asq_session_fk')
                            ->references('id')->on('hr_assessment_sessions')->cascadeOnDelete();
                        $table->foreign($questionId, 'hr_asq_question_fk')
                            ->references('id')->on('hr_assessment_questions')->cascadeOnDelete();
                    } else {
                        $table->foreignId($sessionId)->constrained()->cascadeOnDelete();
                        $table->foreignId($questionId)->constrained()->cascadeOnDelete();
                    }

                    $table->unsignedSmallInteger('urutan');
                    $table->unsignedTinyInteger('jawaban_user')->nullable();
                    $table->boolean('is_correct')->nullable();
                    $table->timestamps();
                });

                $allColumns = ['id', $sessionId, $questionId, ...array_slice($columns, 1)];
                DB::table($tableName)->insertUsing(
                    $allColumns,
                    DB::table($oldTable)->whereNotNull($questionId)->select($allColumns),
                );
                Schema::drop($oldTable);
            }
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
};
