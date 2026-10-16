<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ScopesToAdminSite;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Dasar controller admin untuk data per site: hapus satu, hapus batch,
 * dan hapus per rentang tanggal.
 */
abstract class SiteRecordController extends Controller
{
    use ScopesToAdminSite;

    /** @return class-string<Model> */
    abstract protected function model(): string;

    public function destroy(Request $request, int $record)
    {
        $model = $this->model()::findOrFail($record);
        $this->ensureSameSite($request, $model);
        $model->delete();

        $this->flashSuccess('Data berhasil dihapus.');

        return back();
    }

    public function batchDestroy(Request $request)
    {
        $query = $this->model()::whereIn('id', $this->validatedIds($request));

        if ($site = $request->user()->site) {
            $query->atSite($site);
        }

        $this->flashSuccess($this->deleteEach($query).' data berhasil dihapus.');

        return back();
    }

    public function destroyRange(Request $request)
    {
        return $this->deleteRange($request, function ($from, $to) use ($request) {
            $query = $this->model()::whereBetween('created_at', [$from, $to]);

            if ($site = $this->adminSite($request)) {
                $query->atSite($site);
            }

            return $this->deleteEach($query);
        });
    }
}
