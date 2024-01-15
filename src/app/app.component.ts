import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IMqttMessage,
  IMqttServiceOptions,
  MqttService,
} from 'ngx-mqtt';
import { IClientSubscribeOptions } from 'mqtt-browser';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private curSubscription: Subscription | undefined;
  private curSecondSubscription: Subscription | undefined;
  connectionForm!: FormGroup;
  subscribeForm!: FormGroup;
  publishForm!: FormGroup;
  secondSubscribeForm!: FormGroup;
  receiveNews: Array<any> = []; // Armazena mensagens recebidas
  qosListSubscribe = [
    { label: 0, value: 0 },
    { label: 1, value: 1 },
    { label: 2, value: 2 },
  ];
  qosListPublish = [
    { label: 0, value: 0 },
    { label: 1, value: 1 },
    { label: 2, value: 2 },
  ];
  client: MqttService | undefined; // Cliente MQTT
  isConnection = false; // Indica se está conectado ao servidor MQTT
  subscribeSuccess = false; // Indica se a inscrição foi bem-sucedida
  secondSubscribeSuccess = false; // Indica se a inscrição foi bem-sucedida

  constructor(private _mqttService: MqttService, private _snackBar: MatSnackBar, private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.initConnectionForm();
    this.initsubscribeForm();
    this.initPublishForm();
    this.initSecondSubscribeForm();
  }

  openSnackBar(message: string): void {
    this._snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  initConnectionForm(): void {
    this.connectionForm = this.formBuilder.group({
      hostname: [null],
      port: [null],
      path: [null],
      clean: [false],
      connectTimeout: 4000,
      reconnectPeriod: 4000,
      clientId: [null],
      username: [null],
      password: [null],
      protocol: [null],
      connectOnCreate: [false]
    })

    this.populateConnectionForm();
  }

  initsubscribeForm(): void {
    this.subscribeForm = this.formBuilder.group({
      topic: [null],
      qos: [null],
    })

    this.populateSubscribeForm();
  }

  initSecondSubscribeForm(): void {
    this.secondSubscribeForm = this.formBuilder.group({
      topic: [null],
      qos: [null],
    })

    this.populateSecondSubscribeForm();
  }

  initPublishForm(): void {
    this.publishForm = this.formBuilder.group({
      topic: [null],
      qos: [null],
      payload: [null],
    })

    this.populatepPublishForm();
  }

  populateConnectionForm(): void {
    this.connectionForm.patchValue({
      hostname: 'broker.emqx.io',
      port: 8083,
      path: '/mqtt',
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 10000,
      clientId: 'mqttx_fcfc944a',
      username: 'test_mqtt',
      password: 'test_mqtt*',
      protocol: 'ws',
      connectOnCreate: false,
    })
  }

  populateSubscribeForm(): void {
    this.subscribeForm.patchValue({
      topic: 'mqtt_topic',
      qos: 1,
    })
  }

  populateSecondSubscribeForm(): void {
    this.secondSubscribeForm.patchValue({
      topic: 'mqtt_topic',
      qos: 1,
    })
  }

  populatepPublishForm(): void {
    this.publishForm.patchValue({
      topic: 'mqtt_topic',
      qos: 1,
      payload: '{ "Text": "Enviando informação", "Alert": "false", "Id": "000" }',
    })
  }

  // Método para criar uma conexão MQTT
  createConnection(): void {
    // Inicializa o cliente MQTT
    this.client = this._mqttService;
    try {
      this.client?.connect(this.connectionForm.value as IMqttServiceOptions);
    } catch (error) {
      this.openSnackBar('mqtt.connect error');
    }

    // Tratamento de eventos de conexão
    this.client?.onConnect.subscribe(() => {
      this.isConnection = true;
      this.openSnackBar('Connection succeeded');
    });

    this.client?.onError.subscribe((error: any) => {
      console.log(error)
      this.isConnection = false;
      this.openSnackBar('Connection failed');
    });

    // Tratamento de mensagens recebidas
    this.client?.onMessage.subscribe((packet: any) => {
      const formatObject = {
        msg: JSON.parse(packet.payload),
        topic: packet.topic,
      }
      this.receiveNews.unshift(formatObject);
      console.log(`Received message >> ${packet.payload.toString()} from topic ${packet.topic}`);
    });
  }

  // Método para se inscrever em um tópico MQTT
  doSubscribe(): void {
    this.curSubscription?.unsubscribe();
    if (this.isConnection) {
      this.subscribeSuccess = true;
      const { topic, qos } = this.subscribeForm.value;
      this.curSubscription = this.client?.observe(topic, { qos: qos, retain: false } as IClientSubscribeOptions).subscribe((message: IMqttMessage) => {
        // console.log('Subscribe to topics res >>', message.payload.toString());
      });
    }
  }

  // Método para se inscrever em um tópico MQTT
  doSecondSubscribe(): void {
    this.curSecondSubscription?.unsubscribe();
    if (this.isConnection) {
      this.secondSubscribeSuccess = true;
      const { topic, qos } = this.secondSubscribeForm.value;
      this.curSecondSubscription = this.client?.observe(topic, { qos: qos, retain: false } as IClientSubscribeOptions).subscribe((message: IMqttMessage) => {
        console.log('Subscribe to topics res >>', message.payload.toString());
      });
    }
  }

  // Método para cancelar a inscrição em um tópico MQTT
  doUnSubscribe(): void {
    if (this.curSubscription) {
      this.curSubscription?.unsubscribe();
      this.subscribeSuccess = false;
    }
  }

  // Método para cancelar a inscrição em um tópico MQTT
  doSecondUnSubscribe(): void {
    if (this.curSecondSubscription) {
      this.curSecondSubscription?.unsubscribe();
      this.secondSubscribeSuccess = false;
    }
  }

  // Método para publicar uma mensagem em um tópico MQTT
  doPublish(): void {
    if (this.publishForm.valid) {
      const { topic, qos, payload } = this.publishForm.value;
      this.client?.unsafePublish(topic, payload, { qos: qos });
    }
  }

  // Método para desconectar do servidor MQTT
  destroyConnection(): void {
    if (this.client) {
      this.client?.disconnect(true);
      this.isConnection = false;
    }
    this.openSnackBar('Successfully disconnected');
  }

  ngOnDestroy(): void {
    this.curSubscription?.unsubscribe();
    this.curSecondSubscription?.unsubscribe();
    this.destroyConnection();
  }
}
