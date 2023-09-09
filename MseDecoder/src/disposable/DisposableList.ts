import IDisposable from './IDispoable'

export default class DisposableList {
  private _disposableList: IDisposable[]

  constructor() {
    this._disposableList = []
  }

  public add(disposable: IDisposable) {
    this._disposableList.push(disposable)
  }

  public dispose() {
    this._disposableList.forEach(disposable => disposable.dispose())
    this._disposableList = []
  }
}
