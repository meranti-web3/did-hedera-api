const { Hbar, Timestamp } = require("@hashgraph/sdk");

import { CredentialSubject, HcsVcDocumentBase, HcsVcOperation } from "@hashgraph/did-sdk-js";
import { Body, Controller, Get, Post, Route, Path } from "tsoa";
import { getDidDocument } from "../services/did";
import hederaClient, { getIdentityNetwork, operatorKey } from "../services/hedera";
import { decrypt, encrypt } from "../utils/crypto";

interface IssueVCParams {
  credential: any;
  options: {};
}

@Route("credentials")
export class CredentialsController extends Controller {
  @Post("issue")
  public async issueVerifiableCredential(@Body() { credential }: IssueVCParams) {
    const identityNetwork = getIdentityNetwork()!;

    const VC = HcsVcDocumentBase.fromJsonTree(credential, undefined, CredentialSubject);

    const didDocument = getDidDocument(identityNetwork, operatorKey);

    VC.setIssuer(didDocument.getId());
    VC.setIssuanceDate(Timestamp.fromDate(new Date()));

    const credentialHash = VC.toCredentialHash();

    console.log(VC.toJSON());

    return new Promise(async (resolve, reject) => {
      await identityNetwork
        .createVcTransaction(HcsVcOperation.ISSUE, credentialHash, operatorKey.publicKey)
        .signMessage((doc) => operatorKey.sign(doc))
        .buildAndSignTransaction((tx) => tx.setMaxTransactionFee(new Hbar(2)))
        .onMessageConfirmed((msg) => resolve(msg.open()))
        .onError((err) => reject(err))
        .onEncrypt((msg) => encrypt(msg))
        .onDecrypt((msg) => decrypt(msg))
        .execute(hederaClient);
    });
  }

  /**
   * @example
   * NEVUc3FIV3B0QlZwdVhLbUVXNUZaTnlhVUpub3FrVmZlcmFKNEJ3Y1EzNng
   */
  @Get("{credentialId}")
  public async getCredentialById(@Path() credentialId: string) {
    const identityNetwork = getIdentityNetwork()!;

    return new Promise(async (resolve, reject) => {
      await identityNetwork
        .getVcStatusResolver()
        .addCredentialHash(credentialId)
        .setTimeout(30000)
        .onError((err) => reject(err))
        .whenFinished((res) => {
          console.log(res);
          resolve(res);
        })
        .execute(hederaClient);
    });
  }
}
