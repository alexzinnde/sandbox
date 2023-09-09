import IDisposable from './IDispoable'

export default class Disposable {
  private _disposable: IDisposable
  private _isDisposed: boolean

  constructor(disposable: IDisposable) {
    this._disposable = disposable
    this._isDisposed = false
  }

  dispose(): void {
    if (!this._isDisposed) {
      this._disposable.dispose()
      this._isDisposed = true
    }
  }
}
