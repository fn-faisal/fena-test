
import create from 'zustand';

export const useEmail = create<any>(
    // persist(
        (set: any) => ({
            count: 0,
            total: 0,
            sent: false,
            setSend(sent: boolean) {
                set({ sent })
                localStorage.setItem('email_sent', sent ? (1).toString() : (0).toString());
            },
            setTotal(total: number){
                set({ total })
                localStorage.setItem('email_total', total.toString());
            },
            setCount( count: number ) {
                set({ count });
                localStorage.setItem('email_count', count.toString());
            }
        }),
    //     { name: 'email' }
    // )
);