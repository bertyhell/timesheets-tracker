export class CustomError {
  private error: Error;
  constructor(
    private message: string,
    private cause: any | null = null,
    private additionalInfo: any | null = null
  ) {
    this.error = new Error();
    console.log(this.toString());
  }

  public toString = () => {
    console.log('triggering custom error tostring');
    return JSON.stringify(
      {
        message: this.message,
        innerException: this.cause.message + ' ' + JSON.stringify(this.cause, null, 2),
        additionalInfo: this.additionalInfo,
        stack: this.error.stack,
      },
      null,
      2
    );
  };
}
