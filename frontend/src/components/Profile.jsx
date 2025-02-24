import { useEffect, useState } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

function Profile() {
    const { t } = useTranslation();
    const { btnLabel, description, label, title } = t("Profile");

    const [userState, setUserState] = useState({
        fName: "",
        lName: "",
        email: "",
        newPassword: "",
        confirmNewPassword: "",
        photoURL: "./male-avatar.png",
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUserState((pre) => {
            return {
                ...pre,
                email: "user@example.com", // Example email
                fName: "John", // Example first name
                lName: "Doe", // Example last name
                photoURL: "./male-avatar.png",
            };
        });
        setLoading(false);
    }, []);

    if (loading) return <div className="loading-full">Loading...</div>;

    return (
        <div className="profile-container">
            {/* <div className="image-section">
                <img
                    src={userState.photoURL}
                    alt="User Image"
                    className="profile-image"
                />
                <button className="btn-change-img">{btnLabel.changeImg}</button>
            </div>
           
            <main className="main-section">
                <section className="info-section">
                    <h1 className="section-heading">{title.personalInfo}</h1>
                    <div className="input-group">
                        <div className="input-column">
                            <label htmlFor="fName">{label.fName}</label>
                            <input
                                type="text"
                                name="fName"
                                id="fName"
                                value={userState.fName}
                                className="input-field"
                            />
                        </div>
                        <div className="input-column">
                            <label htmlFor="lName">{label.lName}</label>
                            <input
                                type="text"
                                name="lName"
                                id="lName"
                                value={userState.lName}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <button className="btn-update-name">{btnLabel.updateName}</button>
                </section>

                <section className="password-section">
                    <h2 className="section-heading">{title.changePass}</h2>
                    <div className="input-group">
                        <div className="input-column">
                            <label htmlFor="newPassword">{label.newPass}</label>
                            <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                value={userState.newPassword}
                                className="input-field"
                            />
                        </div>
                        <div className="input-column">
                            <label htmlFor="confirmNewPassword">{label.confirmPass}</label>
                            <input
                                type="password"
                                name="confirmNewPassword"
                                id="confirmNewPassword"
                                value={userState.confirmNewPassword}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <button className="btn-change-pass">{btnLabel.changePass}</button>
                </section>

                <section className="reset-password-section">
                    <h2 className="section-heading">{title.resetPass}</h2>
                    <button className="btn-reset-email">{btnLabel.resetEmail}</button>
                </section>

                <section className="danger-zone-section">
                    <h2 className="section-heading danger">{title.dangerZone}</h2>
                    <p>{description.delete}</p>
                    <button className="btn-delete-account">{btnLabel.deleteAcc}</button>
                </section>
            </main>
         */}
         <div>hello</div>
         </div>
    );
}

export default Profile;
