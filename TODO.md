# <i class="bi bi-list-check"></i> Project TODO List

> **Note:** If the detail is not provided yet either it's done before this markdown has been created or not given the details yet.
> Bootstrap icons are preferred.

---

## <i class="bi bi-person"></i> Student Dashboard

- [x] **Edit Profile** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **View Remaining Session** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **View Sitin History** - <i class="bi bi-check-circle-fill"></i> Done
- [ ] **Feedback** - <i class="bi bi-circle"></i> Not Implemented
- [x] **View Announcement** - <i class="bi bi-check-circle-fill"></i> Done
- [ ] **Sitin Lab Rules/Regulation** - <i class="bi bi-circle"></i> Not Implemented
- [ ] **Reservation** - <i class="bi bi-circle"></i> Not Implemented
- [ ] **Notification/Alert** - <i class="bi bi-circle"></i> Not Implemented
- [ ] **View Rewards/Points** - <i class="bi bi-circle"></i> Not Implemented

### <i class="bi bi-info-circle"></i> More Details: Reservation (Student) with Notification
When the student request for a reservation, it should pop up a card or which is better for this feature implementation. The pop up should display the layout of the lab. The students are asked to choose which seat or PC they want to reserve green indicator should mean the PC is free and stripped red for occupied, although refinement or suggestions for this implementation is open and can be altered like if you choose other colors make sure it defines what it means. But for the UI it could be like a box or better bootstrap icons, again suggestions of alteration are open. The pc that is occupied should not be clickable and indicate that is occupied. Then if the student successfully chose a open PC they would prompted to make sure if they want to reserve on this pc with buttons yes or no, then this request is sent to the admin for approval and notifies the admin with the upcoming developed notification (this varies if it's updated when its done or not so please check).

#### <i class="bi bi-grid-3x3"></i> Lab Layout
**Index:** `0` = PC, `-` = border

```text
0  0  0  0  0  0  0

0  0  0  0  0  0  0
-------------------
0  0  0  0  0  0  0

0  0  0  0  0  0  0
-------------------
0  0  0  0  0  0  0

0  0  0  0  0  0  0
-------------------
0  0  0  0  0  0  0
```

---

## <i class="bi bi-shield-lock"></i> ADMIN Side

- [x] **Search** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **Sitin** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **Student Info/List** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **View Current Sitin** - <i class="bi bi-check-circle-fill"></i> Done
- [x] **View Sitin Records** - <i class="bi bi-check-circle-fill"></i> Done
- [ ] **Generate Reports** (.csv, .docx, or .pdf) - <i class="bi bi-circle"></i> Not Implemented
- [ ] **Reservation** - <i class="bi bi-circle"></i> Not Implemented
- [/] **Create Announcement and Notification** - <i class="bi bi-hourglass-split"></i> 50% (the notification is the only thing not implemented yet)
- [ ] **Analytics** - <i class="bi bi-circle"></i> Not Implemented
- [ ] **Add Rewards / Points** - <i class="bi bi-circle"></i> Not Implemented

### <i class="bi bi-info-circle"></i> More Details: Reservation Admin Side with Notification
The admin is responsible for accepting or deny the student request and notified in the notification button however, the notification should only let the admin know they a reservation request they should not able to accept/deny in the notification tab but rather if they click that notification they will be redirected to the reservation tab and transport them to that student from the request notification. A button should be added in the side-bar for the Reservation button. In the reservation tab there should a PC Control where the layout of the lab be displayed and they can alter if the PC is occupied or not, another tab is that Reservation list, this is where the request of reservation is located either to approve or deny. The last tab is that logs should log the time the request is approved then when the student decides when he is finished or time out.
