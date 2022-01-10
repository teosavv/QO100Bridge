int val = 0;
int currentVal=0;
long timmer = millis()+1000;
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
  pinMode(2, INPUT); //D4
}

void loop() {
  val = !digitalRead(2);
  if (val==1 && currentVal==0){
    currentVal =1;
    Serial.println(1);
  }else if (val==0 && currentVal==1){
    currentVal =0;
    Serial.println(0);
  }
  if (millis() - timmer >= 1000){
    timmer = millis();
    Serial.println(currentVal);
  }
  delay(1);
}
