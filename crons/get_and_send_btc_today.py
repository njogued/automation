import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests
from datetime import datetime

def get_btc_usd_rate():
    api_url = 'https://api.coinbase.com/v2/exchange-rates?currency=BTC'
    dollar_url = 'https://api.coinbase.com/v2/exchange-rates?currency=USD'
    response = requests.get(api_url)
    dollar_response = requests.get(dollar_url)
    if response.status_code == 200:
        data = response.json()
        dollar_conversion = dollar_response.json()
        kes_conversion = float(dollar_conversion['data']['rates']['KES'])
        rate = float(data['data']['rates']['USD'])
        my_btc_value = "VALUES GOES HERE_IN NUMBERS" * rate
        kes_value = my_btc_value * kes_conversion
        output = "1 BTC equals {:,.0f} USD".format(rate)
        output += '\n'
        output += "Holdings equals {:,.0f} USD".format(my_btc_value)
        output += '\n'
        output += "Holdings equals {:,.0f} KES".format(kes_value)
        return output
    else:
        return f'Failed to retrieve data: {response.status_code}'

def send_email(sender_email, sender_password, recipient_emails, subject, body):
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        message = MIMEMultipart()
        message['From'] = sender_email
        message['To'] = ", ".join(recipient_emails)
        message['Subject'] = subject
        message.attach(MIMEText(body, 'plain'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)

        # Send the email
        server.sendmail(sender_email, recipient_emails, message.as_string())
        server.quit()
        print(f"{today}")
        print(f"{body}\n")
    except Exception as e:
        print(f"Failed to send email: {e}")

rate = get_btc_usd_rate()

sender_email = "SENDER EMAIL GOES HERE"
sender_password = "#APP PASSWORD GOES HERE#"
recipient_emails = ["EMAILS GO HERE"]
subject = "BTC Update today"
body = rate
send_email(sender_email, sender_password, recipient_emails, subject, body)
