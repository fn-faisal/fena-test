import Head from 'next/head'
import Image from 'next/image'
import useSocket from '../hooks/useSocket'
import styles from '../styles/Home.module.css'
import * as yup from 'yup';
import { Formik } from 'formik';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useEmail } from '../store/email.store';
import { Page } from '../layouts/page';
import { useRouter } from 'next/router';

export default function Home() {
  const { count, total, sent, setCount, setSend, setTotal } = useEmail();
  const [ busy, setBusy ] = useState(false);

  useEffect(() => {
    const lsCount = localStorage.getItem('email_count');
    if ( lsCount ) setCount(parseInt(lsCount));

    const lsSent = localStorage.getItem('email_sent');
    if ( lsSent ) setSend(lsSent === '1')

    const lsTotal = localStorage.getItem('email_total');
    if ( lsTotal ) setTotal(parseInt(lsTotal));

    (async () => {
      try {
        setBusy(true);
        const resp = await axios.get('/api/sent_emails');
        console.log(resp.data.sentCount > 0, resp.data.sentCount, typeof resp.data.sentCount, total)
        if ( resp.data.sentCount > 0 ) {
          setCount( resp.data.sentCount  );
          setSend(true);
        }
      } catch ( e ) {
        console.error(e)
      } finally {
        setBusy(false);
      }
    })();

  },[]);

  useSocket('email.sent', () => {
    if ( count < total ) {
      setCount( count + 1 );
    } else {
      setCount(0);
      setSend(false);
    }
  });

  useEffect(() => {
    if ( count >= total ) {
      setCount(0);
      setSend(false);
    }
  },[count, total]);

  if ( busy ) {
    return (
      <Page>
        <div role="status">
            <svg aria-hidden="true" className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
      </Page>
    );
  }

  if ( sent ){
    return (
      <Page>
        <div className="w-1/2 bg-gray-200 rounded-full dark:bg-gray-700">
          <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full" style={{ width: ((count / total) * 100).toFixed(2) + '%' }}> {`${((count / total) * 100).toFixed(2)}%`}</div>
        </div>
        <h1 className={styles.title}>Emails sent: {count}</h1>
      </Page>
    );
  }

  return (
    <Page>
        <h1 className={styles.title}>
          Send Emails
        </h1>

        <Formik 
          initialValues={{ emails: 0 }}
          onSubmit={ async (payload: any) => {
            try {
              setBusy(true);
              await axios.get('/api/send_email?emails=' + payload.emails);
              setTotal(parseInt(payload.emails));
              setSend(true);
            }
            catch ( e: any ) {
              console.error(e);
              alert(e?.response?.data?.message || e?.response?.data?.error || 'An error occurred')
            } finally {
              setBusy(false);
            }
          }}
          validationSchema={yup.object({ emails: yup.number().min(1) })}
          component={
            ({ values, handleChange, handleBlur, errors, handleSubmit }) => (
              <form onSubmit={handleSubmit} className={styles.description}>
                <div className="mb-6">
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Enter total emails to send out</label>
                  <input 
                    autoFocus
                    value={values.emails} onChange={handleChange('emails')} 
                    type="text" 
                    className={
                      [
                        errors.emails && 'bg-red-50 border border-red-500 ',
                        "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                      ].join(' ')
                    }
                      required />
                  {
                    errors?.emails &&
                    <p className="mt-2 text-sm text-red-500 dark:text-green-500"><span className="font-medium">{errors?.emails}</span></p>
                  }
                </div>
                <button type='submit' className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Send Email</button>
              </form>
            )
          }
        />
    </Page>
  )
}
