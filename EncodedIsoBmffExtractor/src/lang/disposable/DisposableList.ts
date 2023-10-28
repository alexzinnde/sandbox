import IDisposable from './IDisposable'

export default class DispoableList {
  private readonly _disposables: IDisposable[] = []

  public add(disposable: IDisposable): void {
    this._disposables.push(disposable)
  }

  public dispose(): void {
    while (this._disposables.length) {
      const disposable = this._disposables.shift()

      disposable?.dispose()
    }
  }
}
